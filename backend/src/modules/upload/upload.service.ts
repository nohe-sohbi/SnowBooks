import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yauzl from 'yauzl';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { MP3FileInfo, JobData, JobStatus } from '@/common/interfaces/job.interface';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly tempDir: string;
  private readonly maxFileSize: number;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || './uploads';
    this.tempDir = this.configService.get('TEMP_DIR') || './temp';
    this.maxFileSize = parseInt(this.configService.get('MAX_FILE_SIZE')) || 1073741824; // 1GB
  }

  async handleZipUpload(file: Express.Multer.File): Promise<JobData> {
    // Validate file
    this.validateZipFile(file);

    // Generate job ID and create directories
    const jobId = uuidv4();
    const jobDir = path.join(this.uploadDir, jobId);
    const extractDir = path.join(jobDir, 'extracted');

    try {
      await fs.mkdir(jobDir, { recursive: true });
      await fs.mkdir(extractDir, { recursive: true });

      // Save uploaded ZIP file
      const zipPath = path.join(jobDir, file.originalname);
      await fs.writeFile(zipPath, file.buffer);

      // Extract MP3 files from ZIP
      const mp3Files = await this.extractMP3Files(zipPath, extractDir);

      if (mp3Files.length === 0) {
        throw new BadRequestException('No MP3 files found in the uploaded ZIP');
      }

      // Create job data
      const jobData: JobData = {
        id: jobId,
        originalZipName: file.originalname,
        mp3Files,
        whiteNoiseVolume: 0.3, // Default value
        uploadPath: jobDir,
        status: JobStatus.UPLOADED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save job metadata
      await this.saveJobMetadata(jobData);

      return jobData;
    } catch (error) {
      // Cleanup on error
      await this.cleanupJobDirectory(jobDir);
      throw error;
    }
  }

  private validateZipFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum limit of ${this.maxFileSize} bytes`);
    }

    if (!file.originalname.toLowerCase().endsWith('.zip')) {
      throw new BadRequestException('Only ZIP files are allowed');
    }

    if (file.mimetype !== 'application/zip' && file.mimetype !== 'application/x-zip-compressed') {
      throw new BadRequestException('Invalid file type. Only ZIP files are allowed');
    }
  }

  private async extractMP3Files(zipPath: string, extractDir: string): Promise<MP3FileInfo[]> {
    return new Promise((resolve, reject) => {
      const mp3Files: MP3FileInfo[] = [];

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

          // Check if it's an MP3 file
          if (!entry.fileName.toLowerCase().endsWith('.mp3')) {
            zipfile.readEntry();
            return;
          }

          try {
            const outputPath = path.join(extractDir, path.basename(entry.fileName));
            
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }

              const writeStream = require('fs').createWriteStream(outputPath);
              readStream.pipe(writeStream);

              writeStream.on('close', () => {
                mp3Files.push({
                  name: path.basename(entry.fileName),
                  size: entry.uncompressedSize,
                  path: outputPath,
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
          resolve(mp3Files);
        });

        zipfile.on('error', (error) => {
          reject(new InternalServerErrorException(`ZIP extraction failed: ${error.message}`));
        });
      });
    });
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
      
      for (const jobDir of jobDirs) {
        const jobPath = path.join(this.uploadDir, jobDir);
        const stats = await fs.stat(jobPath);
        
        if (stats.isDirectory() && stats.mtime < cutoffTime) {
          await this.cleanupJobDirectory(jobPath);
          console.log(`Cleaned up expired job: ${jobDir}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired jobs:', error);
    }
  }
}
