import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { UploadService } from '../upload/upload.service';
import { AudioService } from '../audio/audio.service';
import { JobData, JobStatus, ProcessingConfig } from '@/common/interfaces/job.interface';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('audio-processing') private audioQueue: Queue,
    private uploadService: UploadService,
    private audioService: AudioService,
  ) {}

  async getJobStatus(jobId: string): Promise<JobData> {
    const jobData = await this.uploadService.getJobData(jobId);

    if (!jobData) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // A cancelled job is terminal: the Bull job may still finish as
    // 'completed' after the cancel, and must not resurrect the status.
    if (jobData.status === JobStatus.CANCELLED) {
      return jobData;
    }

    // Check if there's an active Bull job
    const bullJob = await this.findBullJob(jobId);
    if (bullJob) {
      // Update status based on Bull job state
      const bullJobState = await bullJob.getState();
      switch (bullJobState) {
        case 'waiting':
        case 'active':
          jobData.status = JobStatus.PROCESSING;
          break;
        case 'completed':
          jobData.status = JobStatus.COMPLETED;
          break;
        case 'failed':
          jobData.status = JobStatus.FAILED;
          if (bullJob.failedReason) {
            jobData.error = bullJob.failedReason;
          }
          break;
      }
    }

    return jobData;
  }

  async startProcessing(jobId: string, config: ProcessingConfig): Promise<void> {
    const jobData = await this.uploadService.getJobData(jobId);
    
    if (!jobData) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (jobData.status !== JobStatus.UPLOADED) {
      throw new BadRequestException(`Job ${jobId} is not in a valid state for processing. Current status: ${jobData.status}`);
    }

    // Update job data with processing config
    jobData.whiteNoiseVolume = config.whiteNoiseVolume;
    jobData.status = JobStatus.PROCESSING;
    await this.uploadService.updateJobData(jobData);

    // Add job to Bull queue
    await this.audioQueue.add('process-audio', {
      jobId,
      config,
    }, {
      jobId, // Use jobId as Bull job ID for easy lookup
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async cancelJob(jobId: string): Promise<void> {
    const jobData = await this.uploadService.getJobData(jobId);

    if (!jobData) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (jobData.status !== JobStatus.UPLOADED && jobData.status !== JobStatus.PROCESSING) {
      throw new BadRequestException(
        `Job ${jobId} cannot be cancelled. Current status: ${jobData.status}`,
      );
    }

    // Mark cancelled first so any in-flight completion cannot override it.
    jobData.status = JobStatus.CANCELLED;
    await this.uploadService.updateJobData(jobData);

    // Kill the FFmpeg process if the job is being processed right now.
    this.audioService.requestCancel(jobId);

    // Remove the Bull job if it is still waiting in the queue. An active job
    // holds a lock and cannot be removed — the processor sees the cancel
    // request and winds the job down itself.
    const bullJob = await this.findBullJob(jobId);
    if (bullJob) {
      try {
        await bullJob.remove();
      } catch (error) {
        // Active job: expected, the kill above ends it.
      }
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    const jobData = await this.uploadService.getJobData(jobId);
    
    if (!jobData) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Stop any in-flight FFmpeg work before deleting its files.
    this.audioService.requestCancel(jobId);

    // Cancel and remove Bull job if it exists
    const bullJob = await this.findBullJob(jobId);
    if (bullJob) {
      try {
        await bullJob.remove();
      } catch (error) {
        // Active job: the cancel request above winds it down.
      }
    }

    // Cleanup job files
    await this.uploadService.cleanupJobDirectory(jobData.uploadPath);
  }

  private async findBullJob(jobId: string): Promise<Job | null> {
    try {
      const job = await this.audioQueue.getJob(jobId);
      return job;
    } catch (error) {
      return null;
    }
  }

  async getQueueStats() {
    const waiting = await this.audioQueue.getWaiting();
    const active = await this.audioQueue.getActive();
    const completed = await this.audioQueue.getCompleted();
    const failed = await this.audioQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
    };
  }
}
