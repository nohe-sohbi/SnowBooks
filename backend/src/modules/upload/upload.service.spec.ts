import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadService } from './upload.service';
import { JobData, JobStatus } from '@/common/interfaces/job.interface';

describe('UploadService', () => {
  let service: UploadService;
  let uploadDir: string;

  const makeConfig = (overrides: Record<string, string> = {}): ConfigService =>
    ({
      get: (key: string) => overrides[key],
    }) as unknown as ConfigService;

  beforeEach(async () => {
    uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snowbooks-upload-'));
    service = new UploadService(makeConfig({ UPLOAD_DIR: uploadDir }));
  });

  afterEach(async () => {
    await fs.rm(uploadDir, { recursive: true, force: true });
  });

  describe('sanitizeFilename', () => {
    it('keeps a plain filename as-is', () => {
      expect(service.sanitizeFilename('chapter-01.mp3')).toBe('chapter-01.mp3');
    });

    it('strips directories from archive entry names', () => {
      expect(service.sanitizeFilename('book/disc 1/chapter-01.mp3')).toBe('chapter-01.mp3');
    });

    it('neutralizes path traversal attempts', () => {
      expect(service.sanitizeFilename('../../../etc/passwd')).toBe('passwd');
    });

    it.each(['', '.', '..', '   '])('rejects unusable name %p', (name) => {
      expect(() => service.sanitizeFilename(name)).toThrow(BadRequestException);
    });
  });

  describe('getJobData', () => {
    const writeJob = async (jobId: string): Promise<JobData> => {
      const jobDir = path.join(uploadDir, jobId);
      await fs.mkdir(jobDir, { recursive: true });
      const jobData: JobData = {
        id: jobId,
        originalZipName: 'book.zip',
        mp3Files: [],
        whiteNoiseVolume: 0.3,
        uploadPath: jobDir,
        status: JobStatus.UPLOADED,
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchive: true,
      };
      await fs.writeFile(
        path.join(jobDir, 'job-metadata.json'),
        JSON.stringify(jobData, null, 2),
      );
      return jobData;
    };

    it('returns stored metadata for a valid job id', async () => {
      const jobId = uuidv4();
      await writeJob(jobId);

      const result = await service.getJobData(jobId);
      expect(result).not.toBeNull();
      expect(result.id).toBe(jobId);
      expect(result.status).toBe(JobStatus.UPLOADED);
    });

    it('returns null for an unknown but well-formed job id', async () => {
      expect(await service.getJobData(uuidv4())).toBeNull();
    });

    it.each([
      '../outside',
      '..%2F..%2Fetc',
      'not-a-uuid',
      'valid-looking/../../escape',
      '00000000-0000-1000-8000-000000000000', // v1, not v4
    ])('refuses to touch the filesystem for non-UUIDv4 id %p', async (jobId) => {
      // Plant a metadata file outside the upload dir that a traversal would reach.
      const outsideDir = path.join(uploadDir, '..', `snowbooks-outside-${path.basename(uploadDir)}`);
      await fs.mkdir(outsideDir, { recursive: true });
      try {
        await fs.writeFile(path.join(outsideDir, 'job-metadata.json'), '{"id":"secret"}');
        expect(await service.getJobData(jobId)).toBeNull();
      } finally {
        await fs.rm(outsideDir, { recursive: true, force: true });
      }
    });
  });

  describe('updateJobData', () => {
    it('persists atomically and survives many concurrent updates', async () => {
      const jobId = uuidv4();
      const jobDir = path.join(uploadDir, jobId);
      await fs.mkdir(jobDir, { recursive: true });

      const jobData: JobData = {
        id: jobId,
        originalZipName: 'book.zip',
        mp3Files: [],
        whiteNoiseVolume: 0.3,
        uploadPath: jobDir,
        status: JobStatus.PROCESSING,
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchive: true,
      };

      await Promise.all(
        Array.from({ length: 25 }, (_, i) =>
          service.updateJobData({
            ...jobData,
            progress: {
              currentFileIndex: 0,
              currentFileName: 'chapter-01.mp3',
              fileProgress: i,
              totalProgress: i,
              processedFiles: 0,
              totalFiles: 1,
            },
          }),
        ),
      );

      // The metadata file must always be complete, parseable JSON…
      const stored = await service.getJobData(jobId);
      expect(stored).not.toBeNull();
      expect(stored.id).toBe(jobId);

      // …and no temp file may be left behind.
      const leftovers = await fs.readdir(jobDir);
      expect(leftovers).toEqual(['job-metadata.json']);
    });
  });

  describe('uniqueExtractedName', () => {
    it('suffixes duplicate basenames instead of overwriting', () => {
      const taken = new Set<string>();
      const unique = (name: string) =>
        (service as any).uniqueExtractedName(name, taken);

      expect(unique('chapter.mp3')).toBe('chapter.mp3');
      expect(unique('chapter.mp3')).toBe('chapter (1).mp3');
      expect(unique('chapter.mp3')).toBe('chapter (2).mp3');
      expect(unique('CHAPTER.mp3')).toBe('CHAPTER (3).mp3');
      expect(unique('other.mp3')).toBe('other.mp3');
    });
  });
});
