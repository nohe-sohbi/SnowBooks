'use client'

import { useState, useEffect } from 'react';

import { AudioCard, ProcessingCard } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AudioIcon } from '@/components/ui/icon';
import { VolumeX, Volume1, Volume2, Info, Sliders, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigureStepProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  fileCount: number;
}

const STORAGE_KEY = 'snowbooks-white-noise-volume';

export const ConfigureStep = ({ volume, onVolumeChange, fileCount }: ConfigureStepProps) => {
  const [localVolume, setLocalVolume] = useState(volume);

  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  useEffect(() => {
    const savedVolume = localStorage.getItem(STORAGE_KEY);
    if (savedVolume) {
      const parsedVolume = parseFloat(savedVolume);
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
        setLocalVolume(parsedVolume);
        onVolumeChange(parsedVolume);
      }
    }
  }, []); // Remove onVolumeChange dependency to prevent infinite loop

  const handleVolumeChange = (newVolume: number) => {
    setLocalVolume(newVolume);
    onVolumeChange(newVolume);
    localStorage.setItem(STORAGE_KEY, newVolume.toString());
  };

  const getVolumeIcon = () => {
    if (localVolume === 0) return <VolumeX className="h-8 w-8 text-ice-gray-400" />;
    if (localVolume < 0.3) return <Volume1 className="h-8 w-8 text-winter-blue-500" />;
    if (localVolume < 0.7) return <Volume2 className="h-8 w-8 text-winter-blue-600" />;
    return <Volume2 className="h-8 w-8 text-warm-amber-500" />;
  };

  const getVolumeColor = () => {
    if (localVolume === 0) return 'text-ice-gray-500';
    if (localVolume < 0.3) return 'text-winter-blue-500';
    if (localVolume < 0.7) return 'text-winter-blue-600';
    return 'text-warm-amber-500';
  };

  const getVolumeDescription = () => {
    if (localVolume === 0) return 'Silent - No white noise will be added';
    if (localVolume < 0.2) return 'Whisper - Very subtle background ambience';
    if (localVolume < 0.4) return 'Gentle - Light winter atmosphere';
    if (localVolume < 0.6) return 'Balanced - Comfortable listening experience';
    if (localVolume < 0.8) return 'Immersive - Rich winter soundscape';
    return 'Enveloping - Full ambient experience';
  };



  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Winter Audio Studio Header */}
        <AudioCard className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-winter-blue-500 to-warm-amber-500" />

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="p-4 rounded-full bg-gradient-to-br from-winter-blue-100 to-warm-amber-100 dark:from-winter-blue-900 dark:to-warm-amber-900">
                  <Sliders className="h-8 w-8 text-winter-blue-600 dark:text-winter-blue-400" />
                </div>
              </div>

              <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-winter-blue-900 to-winter-blue-600 bg-clip-text text-transparent mb-3">
                Configure Winter Ambience
              </h3>
              <p className="text-ice-gray-600 dark:text-ice-gray-400 leading-relaxed max-w-2xl mx-auto">
                Fine-tune the perfect balance of white noise to create your ideal winter audio atmosphere
              </p>
            </div>

            {/* Volume Display with Waveform */}
            <div className="relative mb-8">
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="relative">
                  {getVolumeIcon()}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-warm-amber-500 rounded-full animate-pulse" />
                </div>

                <div className="text-center">
                  <div className={cn("text-5xl font-display font-bold tabular-nums mb-2", getVolumeColor())}>
                    {Math.round(localVolume * 100)}%
                  </div>
                  <p className="text-ice-gray-600 dark:text-ice-gray-400 font-medium">
                    White Noise Intensity
                  </p>
                  <p className="text-sm text-ice-gray-500 dark:text-ice-gray-500 mt-1">
                    {getVolumeDescription()}
                  </p>
                </div>

                <div className="relative">
                  <AudioIcon size="xl" className="text-winter-blue-500" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-winter-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>

            </div>

            {/* Information Card */}
            <div className="bg-gradient-to-r from-winter-blue-50 to-ice-gray-50 dark:from-winter-blue-950 dark:to-ice-gray-950 border border-winter-blue-200 dark:border-winter-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-winter-blue-100 dark:bg-winter-blue-900">
                  <Info className="h-5 w-5 text-winter-blue-600 dark:text-winter-blue-400" />
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                    Winter Audio Processing
                  </h4>
                  <div className="text-sm text-winter-blue-700 dark:text-winter-blue-300 space-y-2">
                    <p>
                      White noise will be carefully mixed with your <strong>{fileCount} MP3 files</strong> to create
                      a consistent, immersive winter atmosphere that masks distracting background sounds.
                    </p>
                    <div className="flex items-center gap-2 text-warm-amber-600 dark:text-warm-amber-400">
                      <span className="font-medium">Recommended: Start with "Gentle" (30%) and adjust to your preference</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AudioCard>

        {/* Custom Volume Slider */}
        <ProcessingCard className="p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Waves className="h-6 w-6 text-winter-blue-600 dark:text-winter-blue-400" />
              <h4 className="text-xl font-semibold text-winter-blue-900 dark:text-winter-blue-100">
                Fine-Tune Volume
              </h4>
            </div>

            <div className="space-y-4">
              <div className="relative">
                {/* Custom Slider Track */}
                <div className="relative h-4 bg-gradient-to-r from-ice-gray-200 to-ice-gray-300 dark:from-ice-gray-700 dark:to-ice-gray-600 rounded-full overflow-hidden">
                  {/* Progress Fill */}
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-winter-blue-500 to-warm-amber-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${localVolume * 100}%` }}
                  />

                  {/* Waveform Pattern Overlay */}
                  <div className="absolute inset-0 flex items-center px-2">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 mx-0.5 bg-white/20 rounded-full"
                        style={{
                          opacity: i / 20 <= localVolume ? 0.6 : 0.2,
                          height: `${Math.sin((i / 20) * Math.PI * 2) * 4 + 6}px`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Slider Input */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label={`Volume slider, currently ${Math.round(localVolume * 100)}%`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(localVolume * 100)}
                  aria-valuetext={`${Math.round(localVolume * 100)}% - ${getVolumeDescription()}`}
                />

                {/* Slider Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-ice-gray-100 border-2 border-winter-blue-500 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:scale-110 cursor-pointer"
                  style={{
                    left: `calc(${localVolume * 100}% - 12px)`,
                    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                  }}
                >
                  <div className="absolute inset-1 bg-gradient-to-br from-winter-blue-400 to-warm-amber-400 rounded-full" />
                </div>
              </div>

              {/* Slider Labels */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-ice-gray-500 dark:text-ice-gray-400">
                  <VolumeX className="h-4 w-4" />
                  <span>Silent</span>
                </div>
                <div className="text-center">
                  <Progress
                    value={localVolume * 100}
                    variant="audio"
                    className="w-24 h-2 mx-auto mb-1"
                  />
                  <span className="text-xs text-ice-gray-500 dark:text-ice-gray-400">
                    Real-time preview
                  </span>
                </div>
                <div className="flex items-center gap-2 text-ice-gray-500 dark:text-ice-gray-400">
                  <span>Immersive</span>
                  <Volume2 className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </ProcessingCard>


      </div>

      </div>
  );
};
