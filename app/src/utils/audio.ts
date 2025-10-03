// Singleton AudioContext manager to prevent memory leaks
class AudioContextManager {
  private static instance: AudioContextManager;
  private audioContext: AudioContext | null = null;
  private isClosing = false;

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  async getContext(): Promise<AudioContext> {
    if (!this.audioContext || this.audioContext.state === 'closed' || this.isClosing) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isClosing = false;
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  async cleanup(): Promise<void> {
    if (this.audioContext && !this.isClosing) {
      this.isClosing = true;
      await this.audioContext.close();
      this.audioContext = null;
      this.isClosing = false;
    }
  }
}

// Create a mixed audio preview with white noise using shared AudioContext
export const createMixedAudioPreview = async (
  mp3Blob: Blob,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number,
  previewDuration: number = 30
): Promise<Blob | null> => {
  try {
    const manager = AudioContextManager.getInstance();
    const audioContext = await manager.getContext();

    // Load both audio files
    const [mp3Buffer, whiteNoiseBuffer] = await Promise.all([
      mp3Blob.arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer)),
      whiteNoiseBlob.arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer))
    ]);

    // Calculate the duration for the preview (min of requested duration and MP3 duration)
    const actualDuration = Math.min(previewDuration, mp3Buffer.duration);
    const sampleRate = audioContext.sampleRate;
    const frameCount = actualDuration * sampleRate;

    // Create output buffer
    const outputBuffer = audioContext.createBuffer(
      Math.max(mp3Buffer.numberOfChannels, whiteNoiseBuffer.numberOfChannels),
      frameCount,
      sampleRate
    );

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

    // Convert buffer to blob
    const length = outputBuffer.length * outputBuffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length); // Add 44 bytes for WAV header
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
    view.setUint16(22, outputBuffer.numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * outputBuffer.numberOfChannels * 2, true);
    view.setUint16(32, outputBuffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < outputBuffer.length; i++) {
      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, outputBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });

  } catch (error) {
    console.error('Failed to create mixed audio preview:', error);
    return null;
  }
};

// Export cleanup function for proper memory management
export const cleanupAudioContext = async (): Promise<void> => {
  const manager = AudioContextManager.getInstance();
  await manager.cleanup();
};
