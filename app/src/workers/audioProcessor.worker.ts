// Web Worker for audio processing to prevent main thread blocking
// This worker handles the CPU-intensive audio mixing operations

interface ProcessAudioMessage {
  type: 'PROCESS_AUDIO';
  mp3Buffer: ArrayBuffer;
  whiteNoiseBuffer: ArrayBuffer;
  whiteNoiseVolume: number;
  fileName: string;
  sampleRate: number;
}

interface ProgressMessage {
  type: 'PROGRESS';
  progress: number;
  fileName: string;
}

interface CompleteMessage {
  type: 'COMPLETE';
  audioBuffer: ArrayBuffer;
  fileName: string;
}

interface ErrorMessage {
  type: 'ERROR';
  error: string;
  fileName: string;
}

type WorkerMessage = ProcessAudioMessage;
type WorkerResponse = ProgressMessage | CompleteMessage | ErrorMessage;

// Decode audio data without AudioContext (Web Workers can't use AudioContext)
async function decodeAudioData(buffer: ArrayBuffer): Promise<{
  sampleRate: number;
  numberOfChannels: number;
  length: number;
  channelData: Float32Array[];
}> {
  // This is a simplified decoder - in production you'd use a proper MP3/WAV decoder
  // For now, we'll assume the buffer contains raw PCM data or use a decoder library

  // Placeholder implementation - in real scenario, use libraries like:
  // - @ffmpeg/ffmpeg for comprehensive audio decoding
  // - lamejs for MP3 decoding
  // - wav-decoder for WAV files

  const view = new DataView(buffer);
  const sampleRate = 44100; // Default sample rate
  const numberOfChannels = 2; // Stereo
  const length = Math.floor(buffer.byteLength / (numberOfChannels * 4)); // 4 bytes per float32 sample

  const channelData: Float32Array[] = [];
  for (let channel = 0; channel < numberOfChannels; channel++) {
    channelData.push(new Float32Array(length));
  }

  // Convert buffer to float32 audio data (simplified)
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const offset = (i * numberOfChannels + channel) * 4;
      if (offset + 3 < buffer.byteLength) {
        channelData[channel][i] = view.getFloat32(offset, true);
      }
    }
  }

  return { sampleRate, numberOfChannels, length, channelData };
}

// Encode audio data back to ArrayBuffer
function encodeAudioData(
  channelData: Float32Array[],
  sampleRate: number,
  numberOfChannels: number
): ArrayBuffer {
  const length = channelData[0].length;
  const buffer = new ArrayBuffer(length * numberOfChannels * 4); // 4 bytes per float32
  const view = new DataView(buffer);

  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const offset = (i * numberOfChannels + channel) * 4;
      view.setFloat32(offset, channelData[channel][i], true);
    }
  }

  return buffer;
}

// Audio processing function that runs in the worker with real mixing logic
async function processAudioInWorker(
  mp3Buffer: ArrayBuffer,
  whiteNoiseBuffer: ArrayBuffer,
  whiteNoiseVolume: number,
  fileName: string,
  sampleRate: number
): Promise<ArrayBuffer> {

  try {
    // Progress: Decoding audio data
    self.postMessage({
      type: 'PROGRESS',
      progress: 10,
      fileName
    } as ProgressMessage);

    // Decode both audio buffers
    const [mp3Audio, whiteNoiseAudio] = await Promise.all([
      decodeAudioData(mp3Buffer),
      decodeAudioData(whiteNoiseBuffer)
    ]);

    self.postMessage({
      type: 'PROGRESS',
      progress: 30,
      fileName
    } as ProgressMessage);

    // Determine output parameters
    const outputChannels = Math.max(mp3Audio.numberOfChannels, whiteNoiseAudio.numberOfChannels);
    const outputLength = mp3Audio.length;
    const outputSampleRate = mp3Audio.sampleRate;

    // Create output channel data
    const outputChannelData: Float32Array[] = [];
    for (let i = 0; i < outputChannels; i++) {
      outputChannelData.push(new Float32Array(outputLength));
    }

    self.postMessage({
      type: 'PROGRESS',
      progress: 40,
      fileName
    } as ProgressMessage);

    // Trim white noise to match MP3 duration (memory optimization)
    const whiteNoiseDurationNeeded = outputLength;
    const whiteNoiseChannelData: Float32Array[] = [];

    for (let channel = 0; channel < whiteNoiseAudio.numberOfChannels; channel++) {
      const originalData = whiteNoiseAudio.channelData[channel];
      const trimmedData = new Float32Array(Math.min(whiteNoiseDurationNeeded, originalData.length));

      for (let i = 0; i < trimmedData.length; i++) {
        trimmedData[i] = originalData[i];
      }

      whiteNoiseChannelData.push(trimmedData);
    }

    self.postMessage({
      type: 'PROGRESS',
      progress: 50,
      fileName
    } as ProgressMessage);

    // Process audio in chunks to allow for progress updates
    const chunkSize = Math.floor(outputLength / 10); // 10 chunks for progress

    for (let chunkStart = 0; chunkStart < outputLength; chunkStart += chunkSize) {
      const chunkEnd = Math.min(chunkStart + chunkSize, outputLength);

      // Mix audio for this chunk
      for (let channel = 0; channel < outputChannels; channel++) {
        const outputData = outputChannelData[channel];

        // Get source channel data (use channel 0 if source has fewer channels)
        const mp3Data = mp3Audio.channelData[Math.min(channel, mp3Audio.numberOfChannels - 1)];
        const whiteNoiseData = whiteNoiseChannelData[Math.min(channel, whiteNoiseChannelData.length - 1)];

        // Mix samples in this chunk
        for (let i = chunkStart; i < chunkEnd; i++) {
          const mp3Sample = i < mp3Data.length ? mp3Data[i] : 0;
          const whiteNoiseSample = i < whiteNoiseData.length ? whiteNoiseData[i] : 0;

          // Mix: original audio + white noise at specified volume
          outputData[i] = mp3Sample + (whiteNoiseSample * whiteNoiseVolume);

          // Prevent clipping
          if (outputData[i] > 1) outputData[i] = 1;
          if (outputData[i] < -1) outputData[i] = -1;
        }
      }

      // Update progress
      const progress = 50 + Math.floor(((chunkStart + chunkSize) / outputLength) * 40);
      self.postMessage({
        type: 'PROGRESS',
        progress: Math.min(progress, 90),
        fileName
      } as ProgressMessage);

      // Yield to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Encode the mixed audio back to ArrayBuffer
    self.postMessage({
      type: 'PROGRESS',
      progress: 95,
      fileName
    } as ProgressMessage);

    const outputBuffer = encodeAudioData(outputChannelData, outputSampleRate, outputChannels);

    self.postMessage({
      type: 'PROGRESS',
      progress: 100,
      fileName
    } as ProgressMessage);

    return outputBuffer;

  } catch (error) {
    throw new Error(`Audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, mp3Buffer, whiteNoiseBuffer, whiteNoiseVolume, fileName, sampleRate } = event.data;
  
  if (type === 'PROCESS_AUDIO') {
    try {
      const processedBuffer = await processAudioInWorker(
        mp3Buffer,
        whiteNoiseBuffer,
        whiteNoiseVolume,
        fileName,
        sampleRate
      );
      
      self.postMessage({
        type: 'COMPLETE',
        audioBuffer: processedBuffer,
        fileName
      } as CompleteMessage);
      
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Processing failed',
        fileName
      } as ErrorMessage);
    }
  }
};

// Export types for TypeScript
export type { WorkerMessage, WorkerResponse, ProcessAudioMessage, ProgressMessage, CompleteMessage, ErrorMessage };
