import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { DownloadService } from './download.service';
import { UploadService } from '../upload/upload.service';
import { JobData, JobStatus } from '@/common/interfaces/job.interface';

describe('DownloadService', () => {
  let service: DownloadService;
  let uploadService: jest.Mocked<Pick<UploadService, 'getJobData'>>;
  let workDir: string;

  const jobId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const makeJob = (status: JobStatus, outputPath?: string): JobData => ({
    id: jobId,
    originalZipName: 'book.zip',
    mp3Files: [],
    whiteNoiseVolume: 0.3,
    uploadPath: workDir,
    outputPath,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    isArchive: true,
  });

  beforeEach(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snowbooks-download-'));
    uploadService = { getJobData: jest.fn() } as any;
    service = new DownloadService(
      { get: () => undefined } as unknown as ConfigService,
      uploadService as unknown as UploadService,
    );
  });

  afterEach(async () => {
    await fs.rm(workDir, { recursive: true, force: true });
  });

  it('throws NotFound for an unknown job', async () => {
    uploadService.getJobData.mockResolvedValue(null);
    await expect(service.getDownloadFile(jobId)).rejects.toThrow(NotFoundException);
  });

  it('rejects a job that is not completed yet', async () => {
    uploadService.getJobData.mockResolvedValue(makeJob(JobStatus.PROCESSING));
    await expect(service.getDownloadFile(jobId)).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound when the output file vanished from disk', async () => {
    uploadService.getJobData.mockResolvedValue(
      makeJob(JobStatus.COMPLETED, path.join(workDir, 'missing.zip')),
    );
    await expect(service.getDownloadFile(jobId)).rejects.toThrow(NotFoundException);
  });

  it.each([
    ['result.zip', 'application/zip'],
    ['result.mp3', 'audio/mpeg'],
    ['result.mp4', 'video/mp4'],
    ['result.mkv', 'video/x-matroska'],
    ['result.webm', 'video/webm'],
  ])('serves %s with mime type %s', async (fileName, mimeType) => {
    const outputPath = path.join(workDir, fileName);
    await fs.writeFile(outputPath, 'data');
    uploadService.getJobData.mockResolvedValue(makeJob(JobStatus.COMPLETED, outputPath));

    const result = await service.getDownloadFile(jobId);
    expect(result).toEqual({ filePath: outputPath, fileName, mimeType });
  });
});
