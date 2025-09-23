'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, LoaderIcon, PackageIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ZipExporterProps {
  processedFiles: Array<{ name: string; blob: Blob }>;
  originalZipName?: string;
}

type ExportStatus = 'idle' | 'creating' | 'downloading' | 'completed' | 'error';

export const ZipExporter = ({ processedFiles, originalZipName }: ZipExporterProps) => {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [error, setError] = useState<string>('');

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
        return <LoaderIcon className="h-5 w-5 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <PackageIcon className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'creating':
        return 'Creating ZIP file...';
      case 'downloading':
        return 'Preparing download...';
      case 'completed':
        return `Successfully exported ${processedFiles.length} files`;
      case 'error':
        return `Error: ${error}`;
      default:
        return 'Ready to export processed files';
    }
  };

  const isProcessing = status === 'creating' || status === 'downloading';

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold">Export Processed Files</h3>
            <p className="text-sm text-muted-foreground">
              Download {processedFiles.length} processed MP3 files as ZIP
            </p>
          </div>
        </div>
        
        <Button
          onClick={createAndDownloadZip}
          disabled={isProcessing || processedFiles.length === 0}
          className="min-w-[140px]"
        >
          {isProcessing ? (
            <>
              <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              {status === 'creating' ? 'Creating...' : 'Downloading...'}
            </>
          ) : status === 'completed' ? (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Exported
            </>
          ) : (
            <>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Download ZIP
            </>
          )}
        </Button>
      </div>

      {/* Status */}
      <div className="text-sm">
        <span className={status === 'error' ? 'text-red-600' : 'text-muted-foreground'}>
          {getStatusText()}
        </span>
      </div>

      {/* File List Preview */}
      {processedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Files to export:</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {processedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Files will be compressed using DEFLATE compression</p>
        <p>• Filename includes timestamp for uniqueness</p>
        <p>• Original file structure and names are preserved</p>
      </div>
    </div>
  );
};
