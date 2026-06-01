// Demo-only audio helpers: full-length client-side mix + runtime white-noise.
// Reuses the existing offline mixer/WAV encoder in ./audio so the demo produces
// a real, downloadable result with no backend.
import { createMixedAudioPreview } from './audio';

// Render the WHOLE mp3 mixed with white noise to a downloadable WAV (no 30s cap).
// createMixedAudioPreview clamps to min(previewDuration, mp3.duration), so a huge
// previewDuration yields the full track.
export const renderFullMixToWav = async (
  mp3Blob: Blob,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number
): Promise<Blob | null> => {
  return createMixedAudioPreview(mp3Blob, whiteNoiseBlob, whiteNoiseVolume, Number.MAX_SAFE_INTEGER);
};

// Generate a white-noise WAV blob at runtime. Replaces the missing /white-noise.mp3
// asset in demo mode and avoids any absolute-path fetch (broken under base=/SnowBooks/).
// The mixer loops the noise (i % length), so a short clip is enough.
export const generateWhiteNoiseBlob = (durationSec = 10, sampleRate = 44100): Blob => {
  const numChannels = 1;
  const frameCount = Math.floor(durationSec * sampleRate);
  const dataLength = frameCount * numChannels * 2; // 16-bit PCM
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  // WAV header (PCM 16-bit, mono)
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Moderate-amplitude white noise so it sits under the narration when mixed.
  let offset = 44;
  for (let i = 0; i < frameCount; i++) {
    const sample = (Math.random() * 2 - 1) * 0.5;
    view.setInt16(offset, sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};
