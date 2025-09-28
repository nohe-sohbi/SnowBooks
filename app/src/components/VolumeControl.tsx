'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AudioIcon } from '@/components/ui/icon';
import { VolumeX, Volume1, Volume2, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const STORAGE_KEY = 'snowbooks-white-noise-volume';

export const VolumeControl = ({ volume, onVolumeChange }: VolumeControlProps) => {
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
  }, [onVolumeChange]);

  const handleVolumeChange = (newVolume: number) => {
    setLocalVolume(newVolume);
    onVolumeChange(newVolume);
    localStorage.setItem(STORAGE_KEY, newVolume.toString());
  };

  const getVolumeIcon = () => {
    if (localVolume === 0) return <VolumeX className="h-5 w-5 text-ice-gray-400" />;
    if (localVolume < 0.3) return <Volume1 className="h-5 w-5 text-winter-blue-500" />;
    if (localVolume < 0.7) return <Volume2 className="h-5 w-5 text-winter-blue-600" />;
    return <Volume2 className="h-5 w-5 text-warm-amber-500" />;
  };

  const getVolumeColor = () => {
    if (localVolume === 0) return 'text-ice-gray-500';
    if (localVolume < 0.3) return 'text-winter-blue-500';
    if (localVolume < 0.7) return 'text-winter-blue-600';
    return 'text-warm-amber-500';
  };

  const presetVolumes = [
    { value: 0, label: '0%', color: 'ice-gray' },
    { value: 0.1, label: '10%', color: 'winter-blue' },
    { value: 0.3, label: '30%', color: 'winter-blue' },
    { value: 0.5, label: '50%', color: 'winter-blue' },
    { value: 0.7, label: '70%', color: 'warm-amber' },
    { value: 1.0, label: '100%', color: 'warm-amber' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 border-2 border-winter-blue-200 dark:border-winter-blue-800 rounded-xl bg-gradient-to-br from-winter-blue-50 to-warm-amber-50 dark:from-winter-blue-950 dark:to-warm-amber-950 audio-control-accessible">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="p-2 rounded-full bg-winter-blue-100 dark:bg-winter-blue-900 flex-shrink-0" aria-hidden="true">
          <Waves className="h-4 sm:h-5 w-4 sm:w-5 text-winter-blue-600 dark:text-winter-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 id="volume-control-label" className="font-semibold text-winter-blue-900 dark:text-winter-blue-100 text-sm sm:text-base audio-label">
            White Noise Volume
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span aria-hidden="true">{getVolumeIcon()}</span>
            <span className={cn("text-base sm:text-lg font-bold tabular-nums", getVolumeColor())} aria-live="polite">
              {Math.round(localVolume * 100)}%
            </span>
          </div>
          {/* Screen reader only status */}
          <div className="sr-only audio-status" aria-live="polite" aria-atomic="true">
            White noise volume set to {Math.round(localVolume * 100)} percent
          </div>
        </div>
        <AudioIcon size="lg" className="text-warm-amber-500" />
      </div>

      {/* Custom Slider */}
      <div className="space-y-4">
        <div className="relative">
          {/* Slider Track with Waveform */}
          <div className="relative h-3 bg-gradient-to-r from-ice-gray-200 to-ice-gray-300 dark:from-ice-gray-700 dark:to-ice-gray-600 rounded-full overflow-hidden">
            {/* Progress Fill */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-winter-blue-500 to-warm-amber-500 rounded-full state-transition progress-shimmer"
              style={{ width: `${localVolume * 100}%` }}
            />

            {/* Waveform Pattern */}
            <div className="absolute inset-0 flex items-center px-1">
              {Array.from({ length: 15 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-0.5 mx-0.5 bg-white/30 rounded-full state-transition",
                    i / 15 <= localVolume && "waveform-bar"
                  )}
                  style={{
                    opacity: i / 15 <= localVolume ? 0.8 : 0.3,
                    height: `${Math.sin((i / 15) * Math.PI * 2) * 2 + 3}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Slider Input */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localVolume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus-winter volume-slider"
            aria-labelledby="volume-control-label"
            aria-valuetext={`${Math.round(localVolume * 100)} percent volume`}
            aria-describedby="volume-help"
          />

          {/* Slider Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-ice-gray-100 border-2 border-winter-blue-500 rounded-full shadow-md state-transition scale-hover cursor-pointer glow-winter"
            style={{ left: `calc(${localVolume * 100}% - 10px)` }}
          >
            <div className="absolute inset-0.5 bg-gradient-to-br from-winter-blue-400 to-warm-amber-400 rounded-full" />
          </div>
        </div>

        {/* Progress Indicator */}
        <Progress
          value={localVolume * 100}
          variant="audio"
          className="h-2"
        />
      </div>

      {/* Preset Buttons */}
      <fieldset className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
        <legend className="sr-only">Volume preset options</legend>
        {presetVolumes.map((preset) => {
          const isSelected = Math.abs(localVolume - preset.value) < 0.01;
          const colorClass = preset.color === 'ice-gray' ? 'ice-gray' :
                           preset.color === 'warm-amber' ? 'warm-amber' : 'winter-blue';

          return (
            <Button
              key={preset.value}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleVolumeChange(preset.value)}
              className={cn(
                "text-xs font-medium transition-all duration-200 px-2 sm:px-3 h-7 sm:h-8 focus-winter touch-target",
                isSelected
                  ? `bg-${colorClass}-500 text-white hover:bg-${colorClass}-600 shadow-md`
                  : `border-${colorClass}-300 dark:border-${colorClass}-600 text-${colorClass}-600 dark:text-${colorClass}-400 hover:bg-${colorClass}-50 dark:hover:bg-${colorClass}-950`
              )}
              aria-pressed={isSelected}
              aria-label={`Set volume to ${preset.label}`}
            >
              {preset.label}
            </Button>
          );
        })}
      </fieldset>

      {/* Info */}
      <div className="text-xs text-winter-blue-600 dark:text-winter-blue-400 bg-winter-blue-100 dark:bg-winter-blue-900 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
          <span className="font-medium">Auto-saved:</span>
          <span id="volume-help">Volume setting is remembered for future sessions. Use arrow keys or click preset buttons to adjust.</span>
        </div>
      </div>
    </div>
  );
};
