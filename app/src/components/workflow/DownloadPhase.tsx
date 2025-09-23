'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, CheckCircleIcon, LoaderIcon, RefreshCwIcon, FileAudioIcon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { formatSize } from '@/utils/formatters';

interface DownloadPhaseProps {
  processedFiles: Array<{ name: string; blob: Blob }>;
  originalZipName: string;
  onStartOver: () => void;
}

type DownloadStatus = 'idle' | 'creating' | 'downloading' | 'completed' | 'error';

export const DownloadPhase = ({ 
  processedFiles, 
  originalZipName, 
  onStartOver 
}: DownloadPhaseProps) => {
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle');
  const [error, setError] = useState<string>('');

  const handleDownload = async () => {
    if (processedFiles.length === 0) {
      setError('No processed files to download');
      setDownloadStatus('error');
      return;
    }

    try {
      setDownloadStatus('creating');
      setError('');

      // Create new ZIP file
      const zip = new JSZip();

      // Add all processed files to the ZIP
      for (const file of processedFiles) {
        zip.file(file.name, file.blob);
      }

      setDownloadStatus('downloading');

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const baseName = originalZipName 
        ? originalZipName.replace(/\.zip$/i, '') 
        : 'processed-audiobook';
      const filename = `${baseName}-with-white-noise-${timestamp}.zip`;

      // Download the file
      saveAs(zipBlob, filename);

      setDownloadStatus('completed');

    } catch (error) {
      console.error('Download failed:', error);
      setError(error instanceof Error ? error.message : 'Download failed');
      setDownloadStatus('error');
    }
  };

  const totalSize = processedFiles.reduce((sum, file) => sum + file.blob.size, 0);

  const getDownloadButtonContent = () => {
    switch (downloadStatus) {
      case 'creating':
        return (
          <>
            <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
            Creating ZIP...
          </>
        );
      case 'downloading':
        return (
          <>
            <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
            Downloading...
          </>
        );
      case 'completed':
        return (
          <>
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Downloaded
          </>
        );
      default:
        return (
          <>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download ZIP
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-green-600">Processing Complete!</h3>
          <p className="text-muted-foreground">
            Your {processedFiles.length} MP3 files have been successfully processed with white noise
          </p>
        </div>
      </div>

      {/* Download Summary */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-6 border rounded-lg bg-green-50">
          <h4 className="font-semibold text-lg mb-4 text-green-800">Ready for Download</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-sm text-green-700">Processed files</p>
              <p className="text-2xl font-bold text-green-800">{processedFiles.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-green-700">Total size</p>
              <p className="text-2xl font-bold text-green-800">{formatSize(totalSize)}</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg">
            <p className="font-medium text-green-800">White noise successfully added</p>
            <p className="text-sm text-green-700">
              All files now include white noise at your selected volume level
            </p>
          </div>
        </div>

        {/* File List Preview */}
        <div className="p-4 border rounded-lg">
          <h5 className="font-medium mb-3">Processed files:</h5>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {processedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <FileAudioIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.blob.size)}
                  </p>
                </div>
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {downloadStatus === 'error' && (
        <div className="max-w-2xl mx-auto p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600 font-medium">Download Error</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={handleDownload} 
          size="lg" 
          className="min-w-[200px]"
          disabled={downloadStatus === 'creating' || downloadStatus === 'downloading'}
        >
          {getDownloadButtonContent()}
        </Button>
        
        <Button onClick={onStartOver} variant="outline" size="lg">
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Process Another ZIP
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>• ZIP file includes all processed MP3 files with white noise</p>
        <p>• Original file names and structure are preserved</p>
        <p>• Files are compressed for efficient download</p>
      </div>
    </div>
  );
};
