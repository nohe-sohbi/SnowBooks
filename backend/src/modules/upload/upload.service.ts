import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import { createWriteStream } from 'fs';
import * as path from 'path';
import * as yauzl from 'yauzl';
import { createExtractorFromData } from 'node-unrar-js';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { MP3FileInfo, JobData, JobStatus } from '@/common/interfaces/job.interface';
import {
  isArchiveFile,
  isMediaFile,
  getMediaType,
  MEDIA_EXTENSIONS,
} from '@/common/media-types';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly tempDir: string;
  private readonly maxFileSize: number;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || './uploads';
    this.tempDir = this.configService.get('TEMP_DIR') || './temp';
    this.maxFileSize = parseInt(this.configService.get('MAX_FILE_SIZE')) || 5368709120; // 5GB
  }

  public sanitizeFilename(filename: string, baseDir: string = ''): string {
    const base = path.basename(filename).trim();
    if (!base || base === '.' || base === '..') {
      throw new BadRequestException('Invalid filename');
    }

    if (baseDir) {
      const outputPath = path.join(baseDir, base);
      const relativePath = path.relative(baseDir, outputPath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new BadRequestException('Path traversal detected');
      }
    }

    return base;
  }

  async handleArchiveUpload(file: Express.Multer.File): Promise<JobData> {
    // Validate file
    this.validateUpload(file);

    // Generate job ID and create directories
    const jobId = uuidv4();
    const jobDir = path.join(this.uploadDir, jobId);
    const extractDir = path.join(jobDir, 'extracted');

    try {
      await fs.mkdir(jobDir, { recursive: true });
      await fs.mkdir(extractDir, { recursive: true });

      const safeOriginalName = this.sanitizeFilename(file.originalname, jobDir);
      const isArchive = isArchiveFile(file.originalname);
      let mediaFiles: MP3FileInfo[];

      if (isArchive) {
        // Move uploaded archive file from temp to job directory
        const archivePath = path.join(jobDir, safeOriginalName);
        await fs.rename(file.path, archivePath);

        // Extract media files from archive (ZIP or RAR)
        const isRar = file.originalname.toLowerCase().endsWith('.rar');
        mediaFiles = isRar
          ? await this.extractMediaFilesFromRar(archivePath, extractDir)
          : await this.extractMediaFiles(archivePath, extractDir);

        if (mediaFiles.length === 0) {
          throw new BadRequestException('No supported audio or video files found in the uploaded archive');
        }
      } else {
        // Direct single media file (e.g. a film or an episode): keep it as-is.
        const mediaPath = path.join(extractDir, safeOriginalName);
        await fs.rename(file.path, mediaPath);

        mediaFiles = [
          {
            name: safeOriginalName,
            size: file.size,
            path: mediaPath,
            type: getMediaType(safeOriginalName),
          },
        ];
      }

      // Create job data
      const jobData: JobData = {
        id: jobId,
        originalZipName: safeOriginalName,
        mp3Files: mediaFiles,
        whiteNoiseVolume: 0.3, // Default value
        uploadPath: jobDir,
        status: JobStatus.UPLOADED,
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchive,
      };

      // Save job metadata
      await this.saveJobMetadata(jobData);

      return jobData;
    } catch (error) {
      // Cleanup on error
      await this.cleanupJobDirectory(jobDir);
      // Also cleanup temp file if it still exists (e.g. rename failed)
      if (file.path) {
        await fs.rm(file.path, { force: true }).catch(() => {});
      }
      throw error;
    }
  }

  private validateUpload(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum limit of ${this.maxFileSize} bytes`);
    }

    if (!isArchiveFile(file.originalname) && !isMediaFile(file.originalname)) {
      throw new BadRequestException(
        `Unsupported file type. Allowed: ZIP, RAR archives or media files (${MEDIA_EXTENSIONS.join(', ')})`,
      );
    }

    const allowedMimeTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/octet-stream',
    ];
    // Browsers report video/* and audio/* for direct media uploads.
    const isMediaMime = file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');
    if (!allowedMimeTypes.includes(file.mimetype) && !isMediaMime) {
      throw new BadRequestException('Invalid file type. Only ZIP/RAR archives or audio/video files are allowed');
    }
  }

  private async extractMediaFiles(zipPath: string, extractDir: string): Promise<MP3FileInfo[]> {
    return new Promise((resolve, reject) => {
      const mediaFiles: MP3FileInfo[] = [];

      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(new BadRequestException('Invalid ZIP file'));
          return;
        }

        zipfile.readEntry();

        zipfile.on('entry', async (entry) => {
          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            zipfile.readEntry();
            return;
          }

          // Check if it's a supported media file (audio or video)
          if (!isMediaFile(entry.fileName)) {
            zipfile.readEntry();
            return;
          }

          try {
            const safeName = this.sanitizeFilename(entry.fileName, extractDir);
            const outputPath = path.join(extractDir, safeName);

            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }

              const writeStream = createWriteStream(outputPath);
              readStream.pipe(writeStream);

              writeStream.on('close', () => {
                mediaFiles.push({
                  name: safeName,
                  size: entry.uncompressedSize,
                  path: outputPath,
                  type: getMediaType(safeName),
                });
                zipfile.readEntry();
              });

              writeStream.on('error', (error) => {
                reject(error);
              });
            });
          } catch (error) {
            reject(error);
          }
        });

        zipfile.on('end', () => {
          resolve(mediaFiles);
        });

        zipfile.on('error', (error) => {
          reject(new InternalServerErrorException(`ZIP extraction failed: ${error.message}`));
        });
      });
    });
  }

  private async extractMediaFilesFromRar(rarPath: string, extractDir: string): Promise<MP3FileInfo[]> {
    const mediaFiles: MP3FileInfo[] = [];

    try {
      const rarBuffer = await fs.readFile(rarPath);
      const extractor = await createExtractorFromData({ data: rarBuffer.buffer.slice(rarBuffer.byteOffset, rarBuffer.byteOffset + rarBuffer.byteLength) as ArrayBuffer });

      const { files } = extractor.extract();

      for (const file of files) {
        const { fileHeader, extraction } = file;

        // Skip directories
        if (fileHeader.flags.directory) {
          continue;
        }

        // Check if it's a supported media file (audio or video)
        if (!isMediaFile(fileHeader.name)) {
          continue;
        }

        const safeName = this.sanitizeFilename(fileHeader.name, extractDir);
        const outputPath = path.join(extractDir, safeName);
        const fileData = extraction as Uint8Array;
        await fs.writeFile(outputPath, fileData);

        mediaFiles.push({
          name: safeName,
          size: fileHeader.unpSize,
          path: outputPath,
          type: getMediaType(safeName),
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`RAR extraction failed: ${error.message}`);
    }

    return mediaFiles;
  }

  private async saveJobMetadata(jobData: JobData): Promise<void> {
    const metadataPath = path.join(jobData.uploadPath, 'job-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(jobData, null, 2));
  }

  async getJobData(jobId: string): Promise<JobData | null> {
    try {
      const jobDir = path.join(this.uploadDir, jobId);
      const metadataPath = path.join(jobDir, 'job-metadata.json');
      
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(metadataContent);
    } catch (error) {
      return null;
    }
  }

  async updateJobData(jobData: JobData): Promise<void> {
    jobData.updatedAt = new Date();
    await this.saveJobMetadata(jobData);
  }

  async cleanupJobDirectory(jobDir: string): Promise<void> {
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup job directory ${jobDir}:`, error);
    }
  }

  async cleanupExpiredJobs(): Promise<void> {
    const cleanupInterval = parseInt(this.configService.get('FILE_CLEANUP_INTERVAL')) || 86400000; // 24 hours
    const cutoffTime = new Date(Date.now() - cleanupInterval);

    try {
      const jobDirs = await fs.readdir(this.uploadDir);

      await Promise.all(
        jobDirs.map(async (jobDir) => {
          const jobPath = path.join(this.uploadDir, jobDir);
          const stats = await fs.stat(jobPath);

          if (stats.isDirectory() && stats.mtime < cutoffTime) {
            await this.cleanupJobDirectory(jobPath);
            console.log(`Cleaned up expired job: ${jobDir}`);
          }
        }),
      );
    } catch (error) {
      console.error('Failed to cleanup expired jobs:', error);
    }
  }
}
