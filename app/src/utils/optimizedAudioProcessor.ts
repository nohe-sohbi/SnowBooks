// Performance-optimized audio processing with minimal memory management overhead
import { globalMemoryManager } from './memoryManager';

// Throttled progress callback to prevent excessive UI updates
class ProgressThrottler {
  private lastUpdate = 0;
  private readonly throttleMs = 100; // Update UI max every 100ms

  shouldUpdate(): boolean {
    const now = Date.now();
    if (now - this.lastUpdate >= this.throttleMs) {
      this.lastUpdate = now;
      return true;
    }
    return false;
  }
}

// Process a single MP3 file with white noise mixing - optimized version
export const processMP3WithWhiteNoiseOptimized = async (
  mp3Blob: Blob,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<Blob | null> => {
  let audioContext: AudioContext | null = null;
  const progressThrottler = new ProgressThrottler();

  try {
    // Initial progress
    if (onProgress && progressThrottler.shouldUpdate()) {
      onProgress(0);
    }

    // Create AudioContext
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Load both audio files
    const [mp3Buffer, whiteNoiseBuffer] = await Promise.all([
      mp3Blob.arrayBuffer().then(buffer => audioContext!.decodeAudioData(buffer)),
      whiteNoiseBlob.arrayBuffer().then(buffer => audioContext!.decodeAudioData(buffer))
    ]);

    if (onProgress && progressThrottler.shouldUpdate()) {
      onProgress(30);
    }

    // Use the full duration of the MP3 file
    const duration = mp3Buffer.duration;
    const sampleRate = audioContext.sampleRate;
    const frameCount = duration * sampleRate;

    // Create output buffer
    const outputBuffer = audioContext.createBuffer(
      Math.max(mp3Buffer.numberOfChannels, whiteNoiseBuffer.numberOfChannels),
      frameCount,
      sampleRate
    );

    if (onProgress && progressThrottler.shouldUpdate()) {
      onProgress(40);
    }

    // Mix the audio with optimized chunking
    const chunkSize = Math.min(frameCount, 44100 * 2); // 2 seconds per chunk (smaller for more frequent yielding)
    const numChunks = Math.ceil(frameCount / chunkSize);
    
    for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      const outputData = outputBuffer.getChannelData(channel);
      const mp3Data = mp3Buffer.getChannelData(Math.min(channel, mp3Buffer.numberOfChannels - 1));
      const whiteNoiseData = whiteNoiseBuffer.getChannelData(Math.min(channel, whiteNoiseBuffer.numberOfChannels - 1));

      // Process in chunks with frequent yielding
      for (let chunk = 0; chunk < numChunks; chunk++) {
        const startIdx = chunk * chunkSize;
        const endIdx = Math.min(startIdx + chunkSize, frameCount);
        
        // Mix the audio samples for this chunk
        for (let i = startIdx; i < endIdx; i++) {
          const mp3Sample = i < mp3Data.length ? mp3Data[i] : 0;
          const whiteNoiseSample = i < whiteNoiseData.length
            ? whiteNoiseData[i % whiteNoiseData.length]
            : 0;

          // Mix: original audio + white noise at specified volume
          outputData[i] = mp3Sample + (whiteNoiseSample * whiteNoiseVolume);

          // Prevent clipping
          if (outputData[i] > 1) outputData[i] = 1;
          if (outputData[i] < -1) outputData[i] = -1;
        }
        
        // Yield control after every chunk (much more frequent)
        await new Promise(resolve => {
          if (window.requestIdleCallback) {
            window.requestIdleCallback(resolve);
          } else {
            setTimeout(resolve, 0);
          }
        });

        // Update progress during mixing
        const mixProgress = 40 + (chunk / numChunks) * 30; // 40-70%
        if (onProgress && progressThrottler.shouldUpdate()) {
          onProgress(Math.round(mixProgress));
        }
      }
    }

    if (onProgress && progressThrottler.shouldUpdate()) {
      onProgress(70);
    }

    // Convert buffer to WAV blob with async processing
    const wavBlob = await audioBufferToWavAsync(outputBuffer, (progress) => {
      const wavProgress = 70 + (progress * 0.3); // 70-100%
      if (onProgress && progressThrottler.shouldUpdate()) {
        onProgress(Math.round(wavProgress));
      }
    });
    
    if (onProgress) {
      onProgress(100);
    }
    
    return wavBlob;

  } catch (error) {
    console.error(`Audio processing error for ${fileName}:`, error);
    return null;
  } finally {
    // Clean up AudioContext
    if (audioContext) {
      try {
        await audioContext.close();
      } catch (cleanupError) {
        console.warn('Failed to cleanup AudioContext:', cleanupError);
      }
    }
  }
};

// Process multiple MP3 files with optimized performance
export const processAllMP3FilesWithWhiteNoiseOptimized = async (
  mp3Files: Array<{ name: string; blob: Blob }>,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number,
  onProgress?: (fileIndex: number, fileProgress: number, totalProgress: number) => void
): Promise<Array<{ name: string; blob: Blob }>> => {
  const processedFiles: Array<{ name: string; blob: Blob }> = [];
  const progressThrottler = new ProgressThrottler();

  // Basic memory check only at the start
  const memoryInfo = globalMemoryManager.getMemoryInfo();
  if (memoryInfo && memoryInfo.percentage > 90) {
    throw new Error(`Memory usage too high (${memoryInfo.percentage}%) to start processing. Please close other applications.`);
  }

  try {
    for (let i = 0; i < mp3Files.length; i++) {
      const file = mp3Files[i];
      
      const processedBlob = await processMP3WithWhiteNoiseOptimized(
        file.blob,
        whiteNoiseBlob,
        whiteNoiseVolume,
        file.name,
        (fileProgress) => {
          const totalProgress = Math.round(((i + fileProgress / 100) / mp3Files.length) * 100);
          // Throttle progress updates to prevent excessive re-renders
          if (onProgress && progressThrottler.shouldUpdate()) {
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

      // Final progress update for this file (always send 100%)
      const totalProgress = Math.round(((i + 1) / mp3Files.length) * 100);
      if (onProgress) {
        onProgress(i, 100, totalProgress);
      }

      // Light cleanup between files (non-blocking)
      if (i < mp3Files.length - 1 && window.gc) {
        // Only use native GC if available, don't create artificial memory pressure
        setTimeout(() => window.gc(), 0);
      }
    }

    return processedFiles;

  } catch (error) {
    console.error('Batch audio processing failed:', error);
    throw error;
  }
};

// Async WAV conversion with chunked processing to prevent blocking
const audioBufferToWavAsync = async (
  buffer: AudioBuffer, 
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  // Write WAV header (fast, no need to chunk)
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Write audio data in chunks to prevent blocking
  const chunkSize = 44100 * buffer.numberOfChannels; // 1 second of audio per chunk
  const totalSamples = buffer.length;
  let offset = 44;
  
  for (let i = 0; i < totalSamples; i += chunkSize) {
    const endIdx = Math.min(i + chunkSize, totalSamples);
    
    // Process this chunk
    for (let sampleIdx = i; sampleIdx < endIdx; sampleIdx++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[sampleIdx]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    // Yield control after each chunk
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Update progress
    if (onProgress) {
      const progress = (endIdx / totalSamples) * 100;
      onProgress(progress);
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};
