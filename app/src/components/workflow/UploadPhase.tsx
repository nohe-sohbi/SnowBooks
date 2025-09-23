'use client'

import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { UploadIcon } from 'lucide-react';

interface UploadPhaseProps {
  onFileUploaded: (file: File) => void;
}

export const UploadPhase = ({ onFileUploaded }: UploadPhaseProps) => {
  const handleDrop = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        onFileUploaded(file);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="text-center space-y-2">
        <UploadIcon className="h-16 w-16 text-muted-foreground mx-auto" />
        <h3 className="text-xl font-semibold">Upload Your Audiobook</h3>
        <p className="text-muted-foreground max-w-md">
          Select a ZIP file containing your MP3 audiobook chapters. We'll extract them and add white noise to each file.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <Dropzone
          accept={{ 'application/zip': ['.zip'] }}
          maxFiles={1}
          maxSize={500 * 1024 * 1024} // 500MB
          onDrop={handleDrop}
          className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors"
        >
          <DropzoneEmptyState>
            <div className="space-y-4 py-8">
              <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop your ZIP file here</p>
                <p className="text-sm text-muted-foreground">
                  Or click to browse (max 500MB)
                </p>
              </div>
            </div>
          </DropzoneEmptyState>
          <DropzoneContent />
        </Dropzone>
      </div>

      <div className="text-xs text-muted-foreground text-center max-w-md space-y-1">
        <p>• ZIP file should contain MP3 files</p>
        <p>• Files will be processed with white noise</p>
        <p>• Original quality will be maintained</p>
      </div>
    </div>
  );
};
