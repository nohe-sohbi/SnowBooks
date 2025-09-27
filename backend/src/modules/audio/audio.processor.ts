import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AudioService } from './audio.service';
import { ProgressService } from '../progress/progress.service';
import { UploadService } from '../upload/upload.service';
import { JobStatus } from '@/common/interfaces/job.interface';

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

      // Process audio files
      const result = await this.audioService.processAudioFiles(
        jobData,
        config,
        (progress) => {
          // Update Bull job progress
          job.progress(progress.totalProgress);
          
          // Send real-time progress via WebSocket
          this.progressService.sendProgress(jobId, progress);
          
          // Update job data with progress
          jobData.progress = progress;
          this.uploadService.updateJobData(jobData);
        },
      );

      // Update job status to completed
      jobData.status = JobStatus.COMPLETED;
      jobData.outputPath = result.outputPath;
      await this.uploadService.updateJobData(jobData);

      // Send completion notification
      this.progressService.sendCompletion(jobId, result);

      this.logger.log(`Audio processing completed for job ${jobId}`);
      return result;

    } catch (error) {
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
    }
  }
}
