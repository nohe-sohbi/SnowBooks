// Real audio processing with white noise mixing using Web Audio API
import { createManagedAudioContext, globalMemoryManager, withMemoryCheck } from './memoryManager';

// Process a single MP3 file with white noise mixing
export const processMP3WithWhiteNoise = async (
  mp3Blob: Blob,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<Blob | null> => {
  let audioContext: AudioContext | null = null;

  try {
    onProgress?.(0);

    // Estimate memory usage for this operation
    const estimatedSizeMB = (mp3Blob.size + whiteNoiseBlob.size) / (1024 * 1024) * 3; // 3x for buffers

    return await withMemoryCheck(async () => {
      audioContext = createManagedAudioContext();

      onProgress?.(10);

      // Load both audio files with memory monitoring
      globalMemoryManager.checkMemoryPressure();

      const [mp3Buffer, whiteNoiseBuffer] = await Promise.all([
        mp3Blob.arrayBuffer().then(buffer => audioContext!.decodeAudioData(buffer)),
        whiteNoiseBlob.arrayBuffer().then(buffer => audioContext!.decodeAudioData(buffer))
      ]);

      onProgress?.(30);
      globalMemoryManager.checkMemoryPressure();

      // Use the full duration of the MP3 file
      const duration = mp3Buffer.duration;
      const sampleRate = audioContext!.sampleRate;
      const frameCount = duration * sampleRate;

      onProgress?.(40);

      // Create output buffer with same characteristics as MP3
      const outputBuffer = audioContext!.createBuffer(
        Math.max(mp3Buffer.numberOfChannels, whiteNoiseBuffer.numberOfChannels),
        frameCount,
        sampleRate
      );

      onProgress?.(50);
      globalMemoryManager.checkMemoryPressure();

      // Mix the audio with chunked processing for large files
      const chunkSize = Math.min(frameCount, 44100 * 10); // 10 seconds max per chunk
      const numChunks = Math.ceil(frameCount / chunkSize);

      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const outputData = outputBuffer.getChannelData(channel);

        // Get MP3 channel data (or use channel 0 if mono)
        const mp3Data = mp3Buffer.getChannelData(
          Math.min(channel, mp3Buffer.numberOfChannels - 1)
        );

        // Get white noise channel data (or use channel 0 if mono)
        const whiteNoiseData = whiteNoiseBuffer.getChannelData(
          Math.min(channel, whiteNoiseBuffer.numberOfChannels - 1)
        );

        // Process in chunks to prevent blocking and allow memory checks
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

          // Yield control and check memory every chunk
          if (chunk % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
            globalMemoryManager.checkMemoryPressure();
          }
        }
      }

      onProgress?.(80);

      // Convert buffer to WAV blob
      const wavBlob = await audioBufferToWav(outputBuffer);

      onProgress?.(100);

      return wavBlob;

    }, estimatedSizeMB, `audio processing for ${fileName}`);

  } catch (error) {
    console.error(`Audio processing error for ${fileName}:`, error);
    return null;
  } finally {
    // Always clean up AudioContext
    if (audioContext) {
      try {
        await globalMemoryManager.cleanupAudioContext(audioContext);
      } catch (cleanupError) {
        console.warn('Failed to cleanup AudioContext:', cleanupError);
      }
    }

    // Suggest garbage collection after processing
    globalMemoryManager.suggestGarbageCollection();
  }
};

// Process multiple MP3 files with white noise
export const processAllMP3FilesWithWhiteNoise = async (
  mp3Files: Array<{ name: string; blob: Blob }>,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number,
  onProgress?: (fileIndex: number, fileProgress: number, totalProgress: number) => void
): Promise<Array<{ name: string; blob: Blob }>> => {
  const processedFiles: Array<{ name: string; blob: Blob }> = [];

  // Start memory monitoring
  const stopMemoryMonitor = globalMemoryManager.createMemoryMonitor ?
    globalMemoryManager.createMemoryMonitor(3000) : () => {};

  try {
    for (let i = 0; i < mp3Files.length; i++) {
      const file = mp3Files[i];

      // Check memory before processing each file
      const memoryInfo = globalMemoryManager.getMemoryInfo();
      if (memoryInfo && memoryInfo.percentage > 85) {
        console.warn(`High memory usage before processing ${file.name}: ${memoryInfo.percentage}%`);

        // Wait for memory to be available
        const memoryAvailable = await globalMemoryManager.waitForMemoryAvailable(
          file.blob.size / (1024 * 1024), // Estimate required memory
          10000 // 10 second timeout
        );

        if (!memoryAvailable) {
          throw new Error(`Insufficient memory to process ${file.name}. Try processing fewer files at once.`);
        }
      }

      const processedBlob = await processMP3WithWhiteNoise(
        file.blob,
        whiteNoiseBlob,
        whiteNoiseVolume,
        file.name,
        (fileProgress) => {
          const totalProgress = Math.round(((i + fileProgress / 100) / mp3Files.length) * 100);
          onProgress?.(i, fileProgress, totalProgress);
        }
      );

      if (processedBlob) {
        processedFiles.push({
          name: file.name,
          blob: processedBlob
        });
      }

      // Update total progress
      const totalProgress = Math.round(((i + 1) / mp3Files.length) * 100);
      onProgress?.(i, 100, totalProgress);

      // Cleanup between files to prevent memory accumulation
      if (i < mp3Files.length - 1) { // Don't cleanup after the last file
        globalMemoryManager.performCleanup();

        // Small delay to allow cleanup to take effect
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return processedFiles;

  } catch (error) {
    console.error('Batch audio processing failed:', error);
    // Cleanup on error
    globalMemoryManager.performEmergencyCleanup();
    throw error;
  } finally {
    // Stop memory monitoring
    stopMemoryMonitor();
  }
};

// Convert AudioBuffer to WAV Blob
const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  // Write WAV header
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

  // Write audio data
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};
