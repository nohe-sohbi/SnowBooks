'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, Square, FileAudioIcon, VolumeXIcon, Volume2Icon } from 'lucide-react';
import { formatSize, formatDuration } from '@/utils/formatters';
import { createMixedAudioPreview } from '@/utils/audio';
import type MP3File from "@/interface/MP3File.tsx";

interface PreviewStepProps {
  mp3Files: MP3File[];
  whiteNoiseBlob: Blob | null;
  whiteNoiseVolume: number;
}

export const PreviewStep = ({ mp3Files, whiteNoiseBlob, whiteNoiseVolume }: PreviewStepProps) => {
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handlePreview = async (fileIndex: number) => {
    const file = mp3Files[fileIndex];

    // Stop current audio if playing
    if (playingIndex === fileIndex && currentAudio) {
      currentAudio.pause();
      URL.revokeObjectURL(currentAudio.src);
      setCurrentAudio(null);
      setPlayingIndex(null);
      return;
    }

    // Stop any other playing audio
    if (currentAudio) {
      currentAudio.pause();
      URL.revokeObjectURL(currentAudio.src);
    }

    setLoadingIndex(fileIndex);

    try {
      let audioBlob = file.blob;

      // If white noise is loaded and volume > 0, create mixed preview
      if (whiteNoiseBlob && whiteNoiseVolume > 0) {
        const mixedBlob = await createMixedAudioPreview(
          file.blob,
          whiteNoiseBlob,
          whiteNoiseVolume,
          30
        );
        if (mixedBlob) {
          audioBlob = mixedBlob;
        }
      }

      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);
      audio.src = url;

      setCurrentAudio(audio);
      setPlayingIndex(fileIndex);
      setLoadingIndex(null);

      audio.currentTime = 0;
      await audio.play();

      const stopAudio = () => {
        audio.pause();
        URL.revokeObjectURL(url);
        setCurrentAudio(null);
        setPlayingIndex(null);
      };

      audio.addEventListener('ended', stopAudio);
      setTimeout(stopAudio, 30000); // 30 second limit

    } catch (error) {
      console.error('Failed to preview audio:', error);
      setPlayingIndex(null);
      setLoadingIndex(null);
    }
  };

  const totalSize = mp3Files.reduce((sum, file) => sum + file.size, 0);
  const totalDuration = mp3Files.reduce((sum, file) => sum + (file.duration || 0), 0);

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">{mp3Files.length}</div>
            <div className="text-sm text-muted-foreground">MP3 Files</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">{formatSize(totalSize)}</div>
            <div className="text-sm text-muted-foreground">Total Size</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">{formatDuration(totalDuration)}</div>
            <div className="text-sm text-muted-foreground">Total Duration</div>
          </div>
        </div>

        {/* White Noise Status */}
        <div className="p-4 border rounded-lg bg-muted/20 mb-6">
          <div className="flex items-center gap-3">
            {whiteNoiseVolume > 0 ? (
              <Volume2Icon className="h-5 w-5 text-primary" />
            ) : (
              <VolumeXIcon className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-medium">
                {whiteNoiseVolume > 0 
                  ? `White noise will be mixed at ${Math.round(whiteNoiseVolume * 100)}% volume`
                  : 'No white noise will be added (volume is 0%)'
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {whiteNoiseVolume > 0 
                  ? 'Click any file below to preview with white noise (30 seconds)'
                  : 'Click any file below to preview original audio (30 seconds)'
                }
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Files to Process</h3>
          <div className="space-y-2">
            {mp3Files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
              >
                <FileAudioIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate mb-1" title={file.name}>
                    {file.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{formatSize(file.size)}</span>
                    {file.duration && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{formatDuration(file.duration)}</span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(index)}
                  disabled={loadingIndex === index}
                  className="flex-shrink-0 h-9 w-9 p-0"
                  title={
                    playingIndex === index
                      ? "Stop preview"
                      : whiteNoiseVolume > 0
                        ? "Preview with white noise (30s)"
                        : "Preview original audio (30s)"
                  }
                >
                  {loadingIndex === index ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  ) : playingIndex === index ? (
                    <Square className="h-4 w-4 fill-current" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Preview Instructions</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Click the play button next to any file to preview it</li>
            <li>• Previews are limited to 30 seconds</li>
            <li>• You'll hear exactly how the final processed files will sound</li>
            <li>• Go back to adjust white noise volume if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
