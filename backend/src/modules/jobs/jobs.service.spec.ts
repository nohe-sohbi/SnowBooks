import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { UploadService } from '../upload/upload.service';
import { AudioService } from '../audio/audio.service';
import { JobData, JobStatus } from '@/common/interfaces/job.interface';
import { Queue } from 'bull';

describe('JobsService', () => {
  let service: JobsService;
  let queue: jest.Mocked<Pick<Queue, 'add' | 'getJob'>>;
  let uploadService: jest.Mocked<
    Pick<UploadService, 'getJobData' | 'updateJobData' | 'cleanupJobDirectory'>
  >;
  let audioService: jest.Mocked<Pick<AudioService, 'requestCancel'>>;

  const jobId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const makeJob = (status: JobStatus): JobData => ({
    id: jobId,
    originalZipName: 'book.zip',
    mp3Files: [],
    whiteNoiseVolume: 0.3,
    uploadPath: `/uploads/${jobId}`,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    isArchive: true,
  });

  beforeEach(() => {
    queue = {
      add: jest.fn(),
      getJob: jest.fn().mockResolvedValue(null),
    } as any;
    uploadService = {
      getJobData: jest.fn(),
      updateJobData: jest.fn(),
      cleanupJobDirectory: jest.fn(),
    } as any;
    audioService = {
      requestCancel: jest.fn(),
    } as any;

    service = new JobsService(
      queue as unknown as Queue,
      uploadService as unknown as UploadService,
      audioService as unknown as AudioService,
    );
  });

  describe('getJobStatus', () => {
    it('throws NotFound for an unknown job', async () => {
      uploadService.getJobData.mockResolvedValue(null);
      await expect(service.getJobStatus(jobId)).rejects.toThrow(NotFoundException);
    });

    it('keeps CANCELLED status even when the Bull job later completed', async () => {
      uploadService.getJobData.mockResolvedValue(makeJob(JobStatus.CANCELLED));
      queue.getJob.mockResolvedValue({
        getState: jest.fn().mockResolvedValue('completed'),
      } as any);

      const result = await service.getJobStatus(jobId);
      expect(result.status).toBe(JobStatus.CANCELLED);
    });

    it('reflects an active Bull job as PROCESSING', async () => {
      uploadService.getJobData.mockResolvedValue(makeJob(JobStatus.UPLOADED));
      queue.getJob.mockResolvedValue({
        getState: jest.fn().mockResolvedValue('active'),
      } as any);

      const result = await service.getJobStatus(jobId);
      expect(result.status).toBe(JobStatus.PROCESSING);
    });
  });

  describe('startProcessing', () => {
    it('queues the job with its processing config', async () => {
      uploadService.getJobData.mockResolvedValue(makeJob(JobStatus.UPLOADED));

      await service.startProcessing(jobId, { whiteNoiseVolume: 0.5 });

      expect(uploadService.updateJobData).toHaveBeenCalledWith(
        expect.objectContaining({ status: JobStatus.PROCESSING, whiteNoiseVolume: 0.5 }),
      );
      expect(queue.add).toHaveBeenCalledWith(
        'process-audio',
        { jobId, config: { whiteNoiseVolume: 0.5 } },
        expect.objectContaining({ jobId }),
      );
    });

    it.each([JobStatus.PROCESSING, JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED])(
      'rejects starting from status %s',
      async (status) => {
        uploadService.getJobData.mockResolvedValue(makeJob(status));
        await expect(
          service.startProcessing(jobId, { whiteNoiseVolume: 0.5 }),
        ).rejects.toThrow(BadRequestException);
        expect(queue.add).not.toHaveBeenCalled();
      },
    );
  });

  describe('cancelJob', () => {
    it('marks the job cancelled and kills its FFmpeg process', async () => {
      uploadService.getJobData.mockResolvedValue(makeJob(JobStatus.PROCESSING));

      await service.cancelJob(jobId);

      expect(uploadService.updateJobData).toHaveBeenCalledWith(
        expect.objectContaining({ status: JobStatus.CANCELLED }),
      );
      expect(audioService.requestCancel).toHaveBeenCalledWith(jobId);
    });

    it('removes a still-waiting Bull job from the queue', async () => {
      uploadService.getJobData.mockResolvedValue(makeJob(JobStatus.UPLOADED));
      const remove = jest.fn().mockResolvedValue(undefined);
      queue.getJob.mockResolvedValue({ remove } as any);

      await service.cancelJob(jobId);
      expect(remove).toHaveBeenCalled();
    });

    it('still succeeds when the active Bull job cannot be removed (lock held)', async () => {
      uploadService.getJobData.mockResolvedValue(makeJob(JobStatus.PROCESSING));
      queue.getJob.mockResolvedValue({
        remove: jest.fn().mockRejectedValue(new Error('job is locked')),
      } as any);

      await expect(service.cancelJob(jobId)).resolves.toBeUndefined();
      expect(audioService.requestCancel).toHaveBeenCalledWith(jobId);
    });

    it.each([JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED])(
      'rejects cancelling a job already in terminal status %s',
      async (status) => {
        uploadService.getJobData.mockResolvedValue(makeJob(status));
        await expect(service.cancelJob(jobId)).rejects.toThrow(BadRequestException);
        expect(audioService.requestCancel).not.toHaveBeenCalled();
      },
    );

    it('throws NotFound for an unknown job', async () => {
      uploadService.getJobData.mockResolvedValue(null);
      await expect(service.cancelJob(jobId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteJob', () => {
    it('stops processing and removes the job directory', async () => {
      uploadService.getJobData.mockResolvedValue(makeJob(JobStatus.PROCESSING));

      await service.deleteJob(jobId);

      expect(audioService.requestCancel).toHaveBeenCalledWith(jobId);
      expect(uploadService.cleanupJobDirectory).toHaveBeenCalledWith(`/uploads/${jobId}`);
    });
  });
});
