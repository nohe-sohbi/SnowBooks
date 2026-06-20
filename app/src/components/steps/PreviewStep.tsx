'use client'

import {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {AudioCard, ProcessingCard} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Loading} from '@/components/ui/loading';
import {AudioIcon, SnowflakeIcon} from '@/components/ui/icon';
import {
    Clock,
    FileAudio,
    HardDrive,
    Headphones,
    Music,
    Pause,
    Play,
    Square,
    Volume2,
    VolumeX,
    Waves
} from 'lucide-react';
import {formatDuration, formatSize} from '@/utils/formatters';
import {createMixedAudioPreview} from '@/utils/audio';
import {cn} from '@/lib/utils';
import type MP3File from "@/interface/MP3File";

interface PreviewStepProps {
  mp3Files: MP3File[];
  whiteNoiseBlob: Blob | null;
  whiteNoiseVolume: number;
}

const PreviewStepComponent = ({ mp3Files, whiteNoiseBlob, whiteNoiseVolume }: PreviewStepProps) => {
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Memoize expensive calculations to prevent unnecessary re-renders
  const { totalSize, totalDuration } = useMemo(() => {
    const totalSize = mp3Files.reduce((sum, file) => sum + file.size, 0);
    const totalDuration = mp3Files.reduce((sum, file) => sum + (file.duration || 0), 0);
    return { totalSize, totalDuration };
  }, [mp3Files]);

  // Clean up progress interval
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      URL.revokeObjectURL(currentAudio.src);
      setCurrentAudio(null);
      setPlayingIndex(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  const handlePreview = async (fileIndex: number) => {
    const file = mp3Files[fileIndex];

    // Stop current audio if playing the same file
    if (playingIndex === fileIndex && currentAudio) {
      stopCurrentAudio();
      return;
    }

    // Stop any other playing audio
    stopCurrentAudio();

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
      audio.src = URL.createObjectURL(audioBlob);

      // Set up audio event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(Math.min(audio.duration, 30)); // 30 second limit
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('play', () => {
        setIsPlaying(true);
      });

      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('ended', () => {
        stopCurrentAudio();
      });

      setCurrentAudio(audio);
      setPlayingIndex(fileIndex);
      setLoadingIndex(null);

      audio.currentTime = 0;
      await audio.play();

      // Set up progress tracking
      progressIntervalRef.current = setInterval(() => {
        if (audio.currentTime >= 30) {
          stopCurrentAudio();
        }
      }, 100);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (audio && !audio.paused) {
          stopCurrentAudio();
        }
      }, 30000);

    } catch (error) {
      console.error('Failed to preview audio:', error);
      setPlayingIndex(null);
      setLoadingIndex(null);
    }
  };

  const togglePlayPause = () => {
    if (currentAudio && playingIndex !== null) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play();
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-5xl mx-auto">
        {/* Winter Audio Studio Header */}
        <AudioCard className="relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-winter-blue-500 to-warm-amber-500" />

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="p-4 rounded-full bg-gradient-to-br from-winter-blue-100 to-warm-amber-100 dark:from-winter-blue-900 dark:to-warm-amber-900">
                  <Headphones className="h-8 w-8 text-winter-blue-600 dark:text-winter-blue-400" />
                </div>
                <SnowflakeIcon size="xl" className="text-warm-amber-500" />
              </div>

              <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-winter-blue-900 to-winter-blue-600 bg-clip-text text-transparent mb-3">
                Preview Your Winter Audio Collection
              </h3>
              <p className="text-ice-gray-600 dark:text-ice-gray-400 leading-relaxed max-w-2xl mx-auto">
                Listen to your audio files with the configured white noise to ensure the perfect winter atmosphere
              </p>
            </div>

            {/* Collection Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* File Count */}
              <div className="text-center p-6 bg-gradient-to-br from-winter-blue-50 to-winter-blue-100 dark:from-winter-blue-950 dark:to-winter-blue-900 rounded-xl border border-winter-blue-200 dark:border-winter-blue-800">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-winter-blue-500 text-white">
                    <FileAudio className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-winter-blue-600 dark:text-winter-blue-400 mb-2">
                  {mp3Files.length}
                </div>
                <div className="text-sm font-medium text-winter-blue-600 dark:text-winter-blue-400">
                  Audio Files
                </div>
              </div>

              {/* Total Size */}
              <div className="text-center p-6 bg-gradient-to-br from-warm-amber-50 to-warm-amber-100 dark:from-warm-amber-950 dark:to-warm-amber-900 rounded-xl border border-warm-amber-200 dark:border-warm-amber-800">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-warm-amber-500 text-white">
                    <HardDrive className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-warm-amber-600 dark:text-warm-amber-400 mb-2">
                  {formatSize(totalSize)}
                </div>
                <div className="text-sm font-medium text-warm-amber-600 dark:text-warm-amber-400">
                  Total Size
                </div>
              </div>

              {/* Total Duration */}
              <div className="text-center p-6 bg-gradient-to-br from-ice-gray-50 to-ice-gray-100 dark:from-ice-gray-950 dark:to-ice-gray-900 rounded-xl border border-ice-gray-200 dark:border-ice-gray-800">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-ice-gray-500 text-white">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-ice-gray-600 dark:text-ice-gray-400 mb-2">
                  {formatDuration(totalDuration)}
                </div>
                <div className="text-sm font-medium text-ice-gray-600 dark:text-ice-gray-400">
                  Total Duration
                </div>
              </div>
            </div>
          </div>
        </AudioCard>

        {/* Winter Audio Player */}
        {playingIndex !== null && (
          <ProcessingCard className="mb-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <Waves className="h-6 w-6 text-winter-blue-600 dark:text-winter-blue-400" />
                <h4 className="text-xl font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                  Now Playing
                </h4>
              </div>

              {/* Currently Playing File Info */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-winter-blue-50 to-warm-amber-50 dark:from-winter-blue-950 dark:to-warm-amber-950 rounded-xl border border-winter-blue-200 dark:border-winter-blue-800">
                <div className="p-3 rounded-full bg-winter-blue-500 text-white">
                  <Music className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-winter-blue-900 dark:text-winter-blue-100 truncate">
                    {mp3Files[playingIndex]?.name}
                  </h5>
                  <div className="flex items-center gap-3 text-sm text-winter-blue-600 dark:text-winter-blue-400">
                    <span>{formatSize(mp3Files[playingIndex]?.size || 0)}</span>
                    <span>•</span>
                    <span>{formatDuration(mp3Files[playingIndex]?.duration || 0)}</span>
                    {whiteNoiseVolume > 0 && (
                      <>
                        <span>•</span>
                        <span>White noise: {Math.round(whiteNoiseVolume * 100)}%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>


              {/* Audio Controls */}
              <div className="flex items-center gap-6">
                {/* Play/Pause Button */}
                <Button
                  onClick={togglePlayPause}
                  size="lg"
                  className="h-14 w-14 rounded-full bg-gradient-to-br from-winter-blue-500 to-winter-blue-600 hover:from-winter-blue-600 hover:to-winter-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </Button>

                {/* Progress Info */}
                <div className="flex-1 space-y-2">
                  <Progress
                    value={duration > 0 ? (currentTime / duration) * 100 : 0}
                    variant="audio"
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-ice-gray-600 dark:text-ice-gray-400">
                    <span className="font-mono">{formatDuration(currentTime)}</span>
                    <span className="font-mono">{formatDuration(Math.min(duration, 30))}</span>
                  </div>
                </div>

                {/* Stop Button */}
                <Button
                  onClick={stopCurrentAudio}
                  variant="outline"
                  size="lg"
                  className="h-14 w-14 rounded-full border-winter-blue-300 dark:border-winter-blue-600 text-winter-blue-600 dark:text-winter-blue-400 hover:bg-winter-blue-50 dark:hover:bg-winter-blue-950"
                >
                  <Square className="h-5 w-5" />
                </Button>
              </div>

              {/* Preview Limit Notice */}
              <div className="mt-4 text-center text-xs text-ice-gray-500 dark:text-ice-gray-400">
                Preview limited to 30 seconds • {Math.max(0, 30 - Math.floor(currentTime))}s remaining
              </div>
            </div>
          </ProcessingCard>
        )}

        {/* White Noise Configuration Status */}
        <ProcessingCard className="mb-8">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-winter-blue-100 to-warm-amber-100 dark:from-winter-blue-900 dark:to-warm-amber-900">
                {whiteNoiseVolume > 0 ? (
                  <Volume2 className="h-6 w-6 text-winter-blue-600 dark:text-winter-blue-400" />
                ) : (
                  <VolumeX className="h-6 w-6 text-ice-gray-500" />
                )}
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-winter-blue-900 dark:text-winter-blue-100 mb-2">
                  {whiteNoiseVolume > 0
                    ? `Winter White Noise: ${Math.round(whiteNoiseVolume * 100)}% Volume`
                    : 'No White Noise (Silent Mode)'
                  }
                </h4>
                <p className="text-sm text-ice-gray-600 dark:text-ice-gray-400">
                  {whiteNoiseVolume > 0
                    ? 'Your audio files will be enhanced with winter white noise at the configured volume level'
                    : 'Audio files will be processed without white noise enhancement'
                  }
                </p>
              </div>

              {whiteNoiseVolume > 0 && (
                <div className="flex items-center gap-2">
                  <Progress
                    value={whiteNoiseVolume * 100}
                    variant="audio"
                    className="w-20 h-2"
                  />
                  <SnowflakeIcon size="sm" className="text-warm-amber-500" />
                </div>
              )}
            </div>
          </div>
        </ProcessingCard>

        {/* Winter-Themed File List */}
        <AudioCard className="p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <FileAudio className="h-6 w-6 text-winter-blue-600 dark:text-winter-blue-400" />
              <h4 className="text-xl font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                Audio Collection ({mp3Files.length} files)
              </h4>
            </div>

            <div className="grid gap-4">
              {mp3Files.map((file, index) => {
                const isCurrentlyPlaying = playingIndex === index;
                const isLoading = loadingIndex === index;

                return (
                  <div
                    key={index}
                    className={cn(
                      "group relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]",
                      isCurrentlyPlaying
                        ? "border-winter-blue-500 bg-gradient-to-r from-winter-blue-50 to-warm-amber-50 dark:from-winter-blue-950 dark:to-warm-amber-950 shadow-lg"
                        : "border-ice-gray-200 dark:border-ice-gray-700 bg-gradient-to-r from-ice-gray-50 to-ice-gray-100 dark:from-ice-gray-900 dark:to-ice-gray-800 hover:border-winter-blue-300 dark:hover:border-winter-blue-600"
                    )}
                  >
                    {/* Playing Indicator */}
                    {isCurrentlyPlaying && (
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-winter-blue-500 rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-warm-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                          <div className="w-2 h-2 bg-winter-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-6">
                      {/* File Icon */}
                      <div className={cn(
                        "p-4 rounded-full transition-all duration-300",
                        isCurrentlyPlaying
                          ? "bg-winter-blue-500 text-white shadow-lg"
                          : "bg-ice-gray-200 dark:bg-ice-gray-700 text-ice-gray-600 dark:text-ice-gray-400 group-hover:bg-winter-blue-100 dark:group-hover:bg-winter-blue-900"
                      )}>
                        <AudioIcon size="lg" />
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <h5 className={cn(
                          "font-semibold text-lg truncate",
                          isCurrentlyPlaying
                            ? "text-winter-blue-900 dark:text-winter-blue-100"
                            : "text-ice-gray-900 dark:text-ice-gray-100"
                        )} title={file.name}>
                          {file.name}
                        </h5>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-4 w-4 text-ice-gray-500" />
                            <span className="font-mono text-ice-gray-600 dark:text-ice-gray-400">
                              {formatSize(file.size)}
                            </span>
                          </div>

                          {file.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-ice-gray-500" />
                              <span className="font-mono text-ice-gray-600 dark:text-ice-gray-400">
                                {formatDuration(file.duration)}
                              </span>
                            </div>
                          )}

                          {whiteNoiseVolume > 0 && (
                            <div className="flex items-center gap-1">
                              <SnowflakeIcon size="xs" className="text-warm-amber-500" />
                              <span className="text-warm-amber-600 dark:text-warm-amber-400 text-xs">
                                +{Math.round(whiteNoiseVolume * 100)}% white noise
                              </span>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Play Button */}
                      <Button
                        onClick={() => handlePreview(index)}
                        disabled={isLoading}
                        size="lg"
                        className={cn(
                          "h-12 w-12 rounded-full transition-all duration-200 shadow-md hover:shadow-lg",
                          isCurrentlyPlaying
                            ? "bg-gradient-to-br from-warm-amber-500 to-warm-amber-600 hover:from-warm-amber-600 hover:to-warm-amber-700 text-white"
                            : "bg-gradient-to-br from-winter-blue-500 to-winter-blue-600 hover:from-winter-blue-600 hover:to-winter-blue-700 text-white"
                        )}
                        title={
                          isCurrentlyPlaying
                            ? "Stop preview"
                            : whiteNoiseVolume > 0
                              ? "Preview with white noise (30s)"
                              : "Preview original audio (30s)"
                        }
                        aria-label={
                          isCurrentlyPlaying
                            ? `Stop playing ${file.name}`
                            : `Play preview of ${file.name}`
                        }
                      >
                        {isLoading ? (
                          <Loading size="sm" />
                        ) : isCurrentlyPlaying ? (
                          <Square className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5 ml-0.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AudioCard>

      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const PreviewStep = memo(PreviewStepComponent);
