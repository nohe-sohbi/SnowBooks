// Real audio processing with white noise mixing using Web Audio API

// Process a single MP3 file with white noise mixing
export const processMP3WithWhiteNoise = async (
  mp3Blob: Blob,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<Blob | null> => {
  try {
    onProgress?.(0);
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    onProgress?.(10);

    // Load both audio files
    const [mp3Buffer, whiteNoiseBuffer] = await Promise.all([
      mp3Blob.arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer)),
      whiteNoiseBlob.arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer))
    ]);

    onProgress?.(30);

    // Use the full duration of the MP3 file
    const duration = mp3Buffer.duration;
    const sampleRate = audioContext.sampleRate;
    const frameCount = duration * sampleRate;

    onProgress?.(40);

    // Create output buffer with same characteristics as MP3
    const outputBuffer = audioContext.createBuffer(
      Math.max(mp3Buffer.numberOfChannels, whiteNoiseBuffer.numberOfChannels),
      frameCount,
      sampleRate
    );

    onProgress?.(50);

    // Mix the audio
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

      // Mix the audio samples
      for (let i = 0; i < frameCount; i++) {
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
    }

    onProgress?.(80);

    // Convert buffer to WAV blob
    const wavBlob = await audioBufferToWav(outputBuffer);
    
    onProgress?.(100);
    
    await audioContext.close();
    return wavBlob;

  } catch (error) {
    console.error(`Audio processing error for ${fileName}:`, error);
    return null;
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

  for (let i = 0; i < mp3Files.length; i++) {
    const file = mp3Files[i];

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
  }

  return processedFiles;
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
