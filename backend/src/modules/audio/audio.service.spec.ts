import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { AudioService } from './audio.service';
import { JobCancelledError } from '@/common/errors';
import { JobData, JobStatus } from '@/common/interfaces/job.interface';

describe('AudioService cancellation', () => {
  let service: AudioService;

  const makeConfig = (): ConfigService =>
    ({ get: () => undefined }) as unknown as ConfigService;

  beforeEach(() => {
    service = new AudioService(makeConfig());
  });

  it('tracks cancel requests until cleared', () => {
    expect(service.isCancelRequested('job-1')).toBe(false);

    service.requestCancel('job-1');
    expect(service.isCancelRequested('job-1')).toBe(true);
    expect(service.isCancelRequested('job-2')).toBe(false);

    service.clearCancelRequest('job-1');
    expect(service.isCancelRequested('job-1')).toBe(false);
  });

  it('kills the registered FFmpeg command of the cancelled job only', () => {
    const kill = jest.fn();
    const otherKill = jest.fn();
    const fakeCommand = { kill, on: jest.fn() };
    const otherCommand = { kill: otherKill, on: jest.fn() };

    (service as any).registerActiveCommand('job-1', fakeCommand);
    (service as any).registerActiveCommand('job-2', otherCommand);

    service.requestCancel('job-1');

    expect(kill).toHaveBeenCalledWith('SIGKILL');
    expect(otherKill).not.toHaveBeenCalled();
  });

  it('unregisters a command once it ends', () => {
    const handlers: Record<string, () => void> = {};
    const kill = jest.fn();
    const fakeCommand = {
      kill,
      on: jest.fn((event: string, handler: () => void) => {
        handlers[event] = handler;
      }),
    };

    (service as any).registerActiveCommand('job-1', fakeCommand);
    handlers['end']();

    service.requestCancel('job-1');
    expect(kill).not.toHaveBeenCalled();
  });

  it('aborts processing with JobCancelledError before touching FFmpeg', async () => {
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snowbooks-audio-'));
    try {
      const jobData: JobData = {
        id: 'job-1',
        originalZipName: 'book.zip',
        mp3Files: [
          { name: 'chapter.mp3', size: 1, path: path.join(workDir, 'chapter.mp3'), type: 'audio' },
        ],
        whiteNoiseVolume: 0.3,
        uploadPath: workDir,
        status: JobStatus.PROCESSING,
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchive: true,
      };

      service.requestCancel('job-1');

      await expect(
        service.processAudioFiles(jobData, { whiteNoiseVolume: 0.3 }, () => {}),
      ).rejects.toThrow(JobCancelledError);
    } finally {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  });
});
