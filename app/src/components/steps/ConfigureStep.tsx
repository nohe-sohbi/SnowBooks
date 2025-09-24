'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VolumeXIcon, Volume1Icon, Volume2Icon, InfoIcon } from 'lucide-react';

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
    if (localVolume === 0) return <VolumeXIcon className="h-6 w-6" />;
    if (localVolume < 0.5) return <Volume1Icon className="h-6 w-6" />;
    return <Volume2Icon className="h-6 w-6" />;
  };

  const presetVolumes = [
    { value: 0, label: '0%', description: 'No white noise' },
    { value: 0.1, label: '10%', description: 'Very subtle' },
    { value: 0.2, label: '20%', description: 'Light background' },
    { value: 0.3, label: '30%', description: 'Recommended' },
    { value: 0.5, label: '50%', description: 'Moderate' },
    { value: 0.7, label: '70%', description: 'Strong' },
    { value: 1.0, label: '100%', description: 'Maximum' }
  ];

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Volume Display */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            {getVolumeIcon()}
            <div>
              <h3 className="text-2xl font-bold">{Math.round(localVolume * 100)}%</h3>
              <p className="text-muted-foreground">White Noise Volume</p>
            </div>
          </div>
          
          <div className="p-4 bg-muted/20 rounded-lg">
            <div className="flex items-start gap-3">
              <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  White noise will be mixed with your {fileCount} MP3 files to help mask background sounds and create a consistent audio environment.
                </p>
                <p>
                  <strong>Recommended:</strong> Start with 30% and adjust based on your preference. You can preview the result before processing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Adjust Volume</label>
            <div className="px-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Silent</span>
                <span>Loud</span>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Quick Presets</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetVolumes.map((preset) => {
                const isSelected = Math.abs(localVolume - preset.value) < 0.01;
                return (
                  <Button
                    key={preset.value}
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleVolumeChange(preset.value)}
                    className={`flex flex-col h-auto py-3 px-4 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-semibold">{preset.label}</span>
                    <span className="text-xs opacity-80">{preset.description}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Info */}
        <div className="p-4 border rounded-lg bg-muted/10">
          <h4 className="font-medium mb-2">Settings</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Current volume:</span>
              <span className="font-mono">{Math.round(localVolume * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Files to process:</span>
              <span className="font-mono">{fileCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Auto-save:</span>
              <span className="text-green-600">Enabled</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Your volume setting will be automatically saved and remembered for future sessions.
          </p>
        </div>
      </div>
    </div>
  );
};
