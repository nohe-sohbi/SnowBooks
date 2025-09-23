'use client'

import { useEffect } from 'react';
import { LoaderIcon, FileAudioIcon } from 'lucide-react';
import JSZip from 'jszip';
import { getAudioDuration } from '@/utils/audio';
import type MP3File from "@/interface/MP3File.tsx";

interface ExtractionPhaseProps {
  file: File;
  progress: number;
  onComplete: (files: MP3File[]) => void;
  onError: (error: string) => void;
  onProgressUpdate: (progress: number) => void;
}

export const ExtractionPhase = ({ 
  file, 
  progress, 
  onComplete, 
  onError, 
  onProgressUpdate 
}: ExtractionPhaseProps) => {
  
  useEffect(() => {
    const extractFiles = async () => {
      try {
        onProgressUpdate(0);
        
        const zip = new JSZip();
        const zipData = await zip.loadAsync(file);
        
        onProgressUpdate(20);

        const mp3Entries = Object.keys(zipData.files).filter(fileName => 
          !zipData.files[fileName].dir && fileName.toLowerCase().endsWith('.mp3')
        );

        if (mp3Entries.length === 0) {
          onError('No MP3 files found in ZIP archive');
          return;
        }

        onProgressUpdate(40);

        const extractedFiles: MP3File[] = [];
        
        for (let i = 0; i < mp3Entries.length; i++) {
          const fileName = mp3Entries[i];
          const fileProgress = 40 + ((i / mp3Entries.length) * 60);
          onProgressUpdate(fileProgress);
          
          try {
            const fileData = zipData.files[fileName];
            const blob = await fileData.async('blob');
            const duration = await getAudioDuration(blob);
            
            extractedFiles.push({
              name: fileName.split('/').pop() || fileName,
              size: blob.size,
              duration,
              blob
            });
          } catch (err) {
            console.warn(`Failed to process ${fileName}:`, err);
          }
        }

        if (extractedFiles.length === 0) {
          onError('Failed to extract any valid MP3 files');
          return;
        }

        onProgressUpdate(100);
        
        // Small delay to show completion
        setTimeout(() => {
          onComplete(extractedFiles);
        }, 500);
        
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to extract ZIP file');
      }
    };

    extractFiles();
  }, [file, onComplete, onError, onProgressUpdate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="text-center space-y-4">
        <LoaderIcon className="h-16 w-16 text-primary animate-spin mx-auto" />
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Extracting Files</h3>
          <p className="text-muted-foreground">
            Extracting MP3 files from <span className="font-medium">{file.name}</span>
          </p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center">
          <span className="text-sm font-medium">{Math.round(progress)}% complete</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-muted-foreground">
        <FileAudioIcon className="h-4 w-4" />
        <span className="text-sm">Looking for MP3 files...</span>
      </div>

      <div className="text-xs text-muted-foreground text-center max-w-md space-y-1">
        <p>• Scanning ZIP archive structure</p>
        <p>• Extracting MP3 files and metadata</p>
        <p>• Validating audio file integrity</p>
      </div>
    </div>
  );
};
