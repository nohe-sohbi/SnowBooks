// Extract audio duration using Web Audio API
export const getAudioDuration = async (blob: Blob): Promise<number | undefined> => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();
    return audioBuffer.duration;
  } catch {
    return undefined;
  }
};
