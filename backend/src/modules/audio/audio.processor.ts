import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AudioService } from './audio.service';
import { ProgressService } from '../progress/progress.service';
import { UploadService } from '../upload/upload.service';
import { JobStatus } from '@/common/interfaces/job.interface';
import { JobCancelledError } from '@/common/errors';

// Progress metadata is persisted to disk at most this often; WebSocket
// updates still go out on every FFmpeg tick.
const PROGRESS_PERSIST_INTERVAL_MS = 1000;

@Processor('audio-processing')
export class AudioProcessor {
  private readonly logger = new Logger(AudioProcessor.name);

  constructor(
    private audioService: AudioService,
    private progressService: ProgressService,
    private uploadService: UploadService,
  ) {}

  @Process('process-audio')
  async handleAudioProcessing(job: Job) {
    const { jobId, config } = job.data;
    this.logger.log(`Starting audio processing for job ${jobId}`);

    try {
      // Get job data
      const jobData = await this.uploadService.getJobData(jobId);
      if (!jobData) {
        throw new Error(`Job data not found for job ${jobId}`);
      }

      // Update job status
      jobData.status = JobStatus.PROCESSING;
      await this.uploadService.updateJobData(jobData);

      let lastPersistedAt = 0;

      // Process audio files
      const result = await this.audioService.processAudioFiles(
        jobData,
        config,
        (progress) => {
          // Update Bull job progress
          job.progress(progress.totalProgress);

          // Send real-time progress via WebSocket
          this.progressService.sendProgress(jobId, progress);

          // Persist progress to job metadata, throttled: FFmpeg emits many
          // ticks per second and each persist is a disk write.
          const now = Date.now();
          if (now - lastPersistedAt >= PROGRESS_PERSIST_INTERVAL_MS || progress.totalProgress >= 100) {
            lastPersistedAt = now;
            jobData.progress = progress;
            void this.uploadService.updateJobData(jobData);
          }
        },
      );

      // A cancel request can land after the last file finished; honour it
      // instead of overwriting the CANCELLED status with COMPLETED.
      if (this.audioService.isCancelRequested(jobId)) {
        throw new JobCancelledError(jobId);
      }

      // Update job status to completed
      jobData.status = JobStatus.COMPLETED;
      jobData.outputPath = result.outputPath;
      await this.uploadService.updateJobData(jobData);

      // Send completion notification
      this.progressService.sendCompletion(jobId, result);

      this.logger.log(`Audio processing completed for job ${jobId}`);
      return result;

    } catch (error) {
      if (error instanceof JobCancelledError) {
        this.logger.log(`Audio processing cancelled for job ${jobId}`);

        const jobData = await this.uploadService.getJobData(jobId);
        if (jobData) {
          jobData.status = JobStatus.CANCELLED;
          await this.uploadService.updateJobData(jobData);
        }

        // Swallow the error: a cancellation is a terminal state, not a
        // failure Bull should retry.
        return;
      }

      this.logger.error(`Audio processing failed for job ${jobId}:`, error);

      // Update job status to failed
      const jobData = await this.uploadService.getJobData(jobId);
      if (jobData) {
        jobData.status = JobStatus.FAILED;
        jobData.error = error.message;
        await this.uploadService.updateJobData(jobData);
      }

      // Send error notification
      this.progressService.sendError(jobId, error.message);

      throw error;
    } finally {
      this.audioService.clearCancelRequest(jobId);
    }
  }
}
