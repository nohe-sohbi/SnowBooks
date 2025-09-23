'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VolumeXIcon, Volume1Icon, Volume2Icon } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const STORAGE_KEY = 'snowbooks-white-noise-volume';

export const VolumeControl = ({ volume, onVolumeChange }: VolumeControlProps) => {
  const [localVolume, setLocalVolume] = useState(volume);

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
    if (localVolume === 0) return <VolumeXIcon className="h-4 w-4" />;
    if (localVolume < 0.5) return <Volume1Icon className="h-4 w-4" />;
    return <Volume2Icon className="h-4 w-4" />;
  };

  const presetVolumes = [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center gap-3">
        {getVolumeIcon()}
        <h3 className="font-semibold">White Noise Volume</h3>
        <span className="text-sm text-muted-foreground">
          {Math.round(localVolume * 100)}%
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localVolume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {presetVolumes.map((preset) => {
            const isSelected = Math.abs(localVolume - preset) < 0.01; // Account for floating point precision
            return (
              <Button
                key={preset}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleVolumeChange(preset)}
                className={`text-xs ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {Math.round(preset * 100)}%
              </Button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Volume setting is automatically saved and will be remembered for future sessions.
      </p>
    </div>
  );
};
