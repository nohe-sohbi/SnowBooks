'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, LoaderIcon, PackageIcon, CheckCircleIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { formatSize } from '@/utils/formatters';

interface DownloadStepProps {
  processedFiles: Array<{ name: string; blob: Blob }>;
  originalZipName?: string;
  onStartOver: () => void;
}

type ExportStatus = 'idle' | 'creating' | 'downloading' | 'completed' | 'error';

export const DownloadStep = ({ processedFiles, originalZipName, onStartOver }: DownloadStepProps) => {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [error, setError] = useState<string>('');
  const [downloadedFileName, setDownloadedFileName] = useState<string>('');

  const createAndDownloadZip = async () => {
    if (processedFiles.length === 0) {
      setError('No processed files to export');
      setStatus('error');
      return;
    }

    try {
      setStatus('creating');
      setError('');

      // Create new ZIP file
      const zip = new JSZip();

      // Add all processed files to the ZIP
      for (const file of processedFiles) {
        zip.file(file.name, file.blob);
      }

      setStatus('downloading');

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
      setDownloadedFileName(filename);
      setStatus('completed');

    } catch (error) {
      console.error('ZIP export failed:', error);
      setError(error instanceof Error ? error.message : 'Export failed');
      setStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'creating':
      case 'downloading':
        return <LoaderIcon className="h-6 w-6 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <PackageIcon className="h-6 w-6 text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'creating':
        return 'Creating ZIP file...';
      case 'downloading':
        return 'Preparing download...';
      case 'completed':
        return `Successfully downloaded: ${downloadedFileName}`;
      case 'error':
        return `Error: ${error}`;
      default:
        return 'Ready to download your processed files';
    }
  };

  const isProcessing = status === 'creating' || status === 'downloading';
  const totalSize = processedFiles.reduce((sum, file) => sum + file.blob.size, 0);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Summary */}
        <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
                Processing Complete!
              </h3>
              <p className="text-green-700 dark:text-green-300">
                Your {processedFiles.length} MP3 files have been successfully processed with white noise.
              </p>
            </div>
          </div>
        </div>

        {/* Download Card */}
        <div className="p-6 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h3 className="text-xl font-semibold">Download Processed Files</h3>
                <p className="text-muted-foreground">
                  {processedFiles.length} files • {formatSize(totalSize)} total
                </p>
              </div>
            </div>
            
            {status !== 'completed' && (
              <Button
                onClick={createAndDownloadZip}
                disabled={isProcessing || processedFiles.length === 0}
                size="lg"
                className="min-w-[140px]"
              >
                {isProcessing ? (
                  <>
                    <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
                    {status === 'creating' ? 'Creating...' : 'Downloading...'}
                  </>
                ) : (
                  <>
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    Download ZIP
                  </>
                )}
              </Button>
            )}

            {status === 'error' && (
              <Button
                onClick={() => setStatus('idle')}
                variant="outline"
                size="lg"
              >
                <RefreshCwIcon className="h-5 w-5 mr-2" />
                Try Again
              </Button>
            )}
          </div>

          {/* Status */}
          <div className="mb-4">
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
              {getStatusText()}
            </p>
          </div>

          {/* Completed State */}
          {status === 'completed' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                <DownloadIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">Download Complete!</p>
                  <p className="text-sm">Your processed files have been saved to your downloads folder.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* File List Preview */}
        <div className="p-4 border rounded-lg bg-muted/10">
          <h4 className="font-medium mb-3">Files in ZIP Archive</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {processedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="text-muted-foreground font-mono text-xs">
                  {formatSize(file.blob.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Export Info */}
        <div className="p-4 border rounded-lg bg-muted/10">
          <h4 className="font-medium mb-3">Export Details</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Files processed:</span>
              <span className="font-mono">{processedFiles.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total size:</span>
              <span className="font-mono">{formatSize(totalSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>Format:</span>
              <span>WAV (high quality)</span>
            </div>
            <div className="flex justify-between">
              <span>Compression:</span>
              <span>DEFLATE (ZIP)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center pt-6">
          <Button onClick={onStartOver} variant="outline" size="lg">
            <RefreshCwIcon className="h-5 w-5 mr-2" />
            Process Another ZIP File
          </Button>
        </div>
      </div>
    </div>
  );
};
