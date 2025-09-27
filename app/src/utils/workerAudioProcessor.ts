// Alternative audio processor using Web Workers for maximum performance
// This moves all CPU-intensive audio processing off the main thread

import { audioWorkerManager } from './audioWorkerManager';

interface ProcessingProgress {
  fileIndex: number;
  fileProgress: number;
  totalProgress: number;
  fileName: string;
}

/**
 * Process a single MP3 file with white noise using Web Worker
 */
export async function processMP3WithWhiteNoiseWorker(
  mp3Blob: Blob,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  try {
    // Convert blobs to ArrayBuffers
    const [mp3Buffer, whiteNoiseBuffer] = await Promise.all([
      mp3Blob.arrayBuffer(),
      whiteNoiseBlob.arrayBuffer()
    ]);

    // Process in Web Worker
    const processedBuffer = await audioWorkerManager.processAudio(
      mp3Buffer,
      whiteNoiseBuffer,
      whiteNoiseVolume,
      fileName,
      44100, // Sample rate
      onProgress
    );

    // Convert back to Blob (WAV format)
    return new Blob([processedBuffer], { type: 'audio/wav' });

  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    return null;
  }
}

/**
 * Process all MP3 files with white noise using Web Workers
 * This provides maximum performance by keeping the main thread free
 */
export async function processAllMP3FilesWithWhiteNoiseWorker(
  mp3Files: Array<{ name: string; blob: Blob }>,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number,
  onProgress?: (fileIndex: number, fileProgress: number, totalProgress: number) => void
): Promise<Array<{ name: string; blob: Blob }>> {
  const processedFiles: Array<{ name: string; blob: Blob }> = [];

  try {
    for (let i = 0; i < mp3Files.length; i++) {
      const file = mp3Files[i];
      
      const processedBlob = await processMP3WithWhiteNoiseWorker(
        file.blob,
        whiteNoiseBlob,
        whiteNoiseVolume,
        file.name,
        (fileProgress) => {
          const totalProgress = Math.round(((i + fileProgress / 100) / mp3Files.length) * 100);
          if (onProgress) {
            onProgress(i, fileProgress, totalProgress);
          }
        }
      );

      if (processedBlob) {
        processedFiles.push({
          name: file.name,
          blob: processedBlob
        });
      }

      // Final progress update for this file
      const totalProgress = Math.round(((i + 1) / mp3Files.length) * 100);
      if (onProgress) {
        onProgress(i, 100, totalProgress);
      }
    }

    return processedFiles;

  } catch (error) {
    console.error('Error processing files with Web Worker:', error);
    throw error;
  }
}

/**
 * Check if Web Workers are supported and available
 */
export function isWebWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Get performance comparison between main thread and Web Worker processing
 */
export async function benchmarkProcessingMethods(
  testFile: Blob,
  whiteNoiseBlob: Blob
): Promise<{
  mainThread: number;
  webWorker: number;
  improvement: number;
}> {
  const testVolume = 0.3;
  const testFileName = 'benchmark-test.mp3';

  // Benchmark main thread processing
  const mainThreadStart = performance.now();
  try {
    // Import the main thread processor
    const { processMP3WithWhiteNoiseOptimized } = await import('./optimizedAudioProcessor');
    await processMP3WithWhiteNoiseOptimized(testFile, whiteNoiseBlob, testVolume, testFileName);
  } catch (error) {
    console.warn('Main thread benchmark failed:', error);
  }
  const mainThreadTime = performance.now() - mainThreadStart;

  // Benchmark Web Worker processing
  const webWorkerStart = performance.now();
  try {
    await processMP3WithWhiteNoiseWorker(testFile, whiteNoiseBlob, testVolume, testFileName);
  } catch (error) {
    console.warn('Web Worker benchmark failed:', error);
  }
  const webWorkerTime = performance.now() - webWorkerStart;

  const improvement = mainThreadTime > 0 ? ((mainThreadTime - webWorkerTime) / mainThreadTime) * 100 : 0;

  return {
    mainThread: mainThreadTime,
    webWorker: webWorkerTime,
    improvement: Math.max(0, improvement)
  };
}
