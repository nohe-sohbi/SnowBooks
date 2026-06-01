// Client-side demo implementation of the audio processing API.
// No backend: uses a bundled sample, generates white noise at runtime, and
// renders the real mixed result in the browser via the Web Audio API.
import { renderFullMixToWav, generateWhiteNoiseBlob } from '@/utils/renderMixedAudio';
import {
  JobStatus,
  type JobData,
  type JobProgress,
  type ProcessingConfig,
  type UploadResponse,
} from './audioProcessingAPI';

// BASE_URL is '/' in dev and '/SnowBooks/' on Pages, never an absolute path.
const SAMPLE_URL = `${import.meta.env.BASE_URL}sample-audiobook.mp3`;

interface DemoJob {
  id: string;
  originalName: string;
  sampleBlob: Blob;
  duration: number;
  volume: number;
  rendered?: Blob;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

class DemoAudioProcessingAPI {
  private jobs = new Map<string, DemoJob>();
  private progressCallbacks = new Map<string, (progress: JobProgress) => void>();
  private completionCallbacks = new Map<string, (result: any) => void>();
  private errorCallbacks = new Map<string, (error: string) => void>();

  private async loadSample(): Promise<{ blob: Blob; duration: number }> {
    const res = await fetch(SAMPLE_URL);
    if (!res.ok) throw new Error(`Demo sample not found at ${SAMPLE_URL}`);
    const blob = await res.blob();
    let duration = 0;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
      duration = decoded.duration;
      await ctx.close();
    } catch {
      duration = 0;
    }
    return { blob, duration };
  }

  // The dropped file is ignored, the demo always processes the bundled sample.
  async uploadZip(file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    for (let pct = 0; pct <= 100; pct += 25) {
      onProgress?.(pct);
      await delay(120);
    }
    const { blob, duration } = await this.loadSample();
    const jobId = crypto.randomUUID();
    const originalName = file?.name?.replace(/\.(zip|rar)$/i, '') || 'sample-audiobook';
    this.jobs.set(jobId, { id: jobId, originalName, sampleBlob: blob, duration, volume: 0.3 });
    return {
      jobId,
      originalZipName: file?.name || 'sample-audiobook.zip',
      fileCount: 1,
      totalSize: blob.size,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
    };
  }

  async getJobStatus(jobId: string): Promise<JobData> {
    const job = this.requireJob(jobId);
    const now = new Date().toISOString();
    return {
      id: job.id,
      originalZipName: `${job.originalName}.zip`,
      mp3Files: [
        {
          name: `${job.originalName}.mp3`,
          size: job.sampleBlob.size,
          duration: job.duration,
          path: '',
          blob: job.sampleBlob,
        },
      ],
      whiteNoiseVolume: job.volume,
      uploadPath: '',
      status: JobStatus.UPLOADED,
      createdAt: now,
      updatedAt: now,
    };
  }

  async startProcessing(jobId: string, config: ProcessingConfig): Promise<void> {
    const job = this.requireJob(jobId);
    job.volume = config.whiteNoiseVolume;
    // Background render; progress + completion fire via the subscribed callbacks.
    void this.runDemoProcessing(jobId);
  }

  private async runDemoProcessing(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    const onProgress = this.progressCallbacks.get(jobId);
    const onCompletion = this.completionCallbacks.get(jobId);
    const onError = this.errorCallbacks.get(jobId);
    if (!job) {
      onError?.('Demo job not found');
      return;
    }
    const fileName = `${job.originalName}.mp3`;
    const emit = (pct: number, processed: number) =>
      onProgress?.({
        currentFileIndex: 0,
        currentFileName: fileName,
        fileProgress: pct,
        totalProgress: pct,
        processedFiles: processed,
        totalFiles: 1,
      });
    try {
      for (let pct = 10; pct <= 80; pct += 14) {
        emit(pct, 0);
        await delay(220);
      }
      const noise = generateWhiteNoiseBlob(10);
      const rendered = await renderFullMixToWav(job.sampleBlob, noise, job.volume);
      if (!rendered) throw new Error('Audio render failed');
      job.rendered = rendered;
      emit(100, 1);
      onCompletion?.(null);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Demo processing failed');
    }
  }

  async downloadResult(jobId: string): Promise<Blob> {
    const job = this.requireJob(jobId);
    if (!job.rendered) throw new Error('Nothing to download yet');
    return job.rendered;
  }

  async getDownloadInfo(
    jobId: string,
  ): Promise<{ fileName: string; fileSize: number; fileCount: number }> {
    const job = this.requireJob(jobId);
    return {
      fileName: `${job.originalName}-with-white-noise.wav`,
      fileSize: job.rendered?.size ?? 0,
      fileCount: 1,
    };
  }

  subscribeToProgress(
    jobId: string,
    onProgress: (progress: JobProgress) => void,
    onCompletion?: (result: any) => void,
    onError?: (error: string) => void,
  ): () => void {
    this.progressCallbacks.set(jobId, onProgress);
    if (onCompletion) this.completionCallbacks.set(jobId, onCompletion);
    if (onError) this.errorCallbacks.set(jobId, onError);
    return () => {
      this.progressCallbacks.delete(jobId);
      this.completionCallbacks.delete(jobId);
      this.errorCallbacks.delete(jobId);
    };
  }

  // No-ops kept for parity with the real API surface.
  async cancelJob(_jobId: string): Promise<void> {}
  async deleteJob(jobId: string): Promise<void> {
    this.jobs.delete(jobId);
  }
  disconnect(): void {
    this.progressCallbacks.clear();
    this.completionCallbacks.clear();
    this.errorCallbacks.clear();
  }
  async healthCheck(): Promise<boolean> {
    return true;
  }

  private requireJob(jobId: string): DemoJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Demo job ${jobId} not found`);
    return job;
  }
}

export const demoAudioProcessingAPI = new DemoAudioProcessingAPI();
export default demoAudioProcessingAPI;
