import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UploadService } from '../upload/upload.service';
import { JobStatus } from '@/common/interfaces/job.interface';

@Injectable()
export class DownloadService {
  private readonly uploadDir: string;

  constructor(
    private configService: ConfigService,
    private uploadService: UploadService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || './uploads';
  }

  async getDownloadFile(jobId: string): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    // Get job data
    const jobData = await this.uploadService.getJobData(jobId);
    
    if (!jobData) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (jobData.status !== JobStatus.COMPLETED) {
      throw new BadRequestException(`Job ${jobId} is not completed. Current status: ${jobData.status}`);
    }

    if (!jobData.outputPath) {
      throw new BadRequestException(`No output file available for job ${jobId}`);
    }

    // Check if output file exists
    try {
      await fs.access(jobData.outputPath);
    } catch (error) {
      throw new NotFoundException(`Output file not found for job ${jobId}`);
    }

    const fileName = path.basename(jobData.outputPath);
    const mimeType = this.getMimeType(fileName);

    return {
      filePath: jobData.outputPath,
      fileName,
      mimeType,
    };
  }

  async getFileStats(jobId: string) {
    const downloadInfo = await this.getDownloadFile(jobId);
    
    try {
      const stats = await fs.stat(downloadInfo.filePath);
      
      return {
        fileName: downloadInfo.fileName,
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        mimeType: downloadInfo.mimeType,
      };
    } catch (error) {
      throw new NotFoundException(`File stats not available for job ${jobId}`);
    }
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    
    switch (ext) {
      case '.zip':
        return 'application/zip';
      case '.mp3':
        return 'audio/mpeg';
      case '.wav':
        return 'audio/wav';
      default:
        return 'application/octet-stream';
    }
  }

  async cleanupDownloadFile(jobId: string): Promise<void> {
    try {
      const downloadInfo = await this.getDownloadFile(jobId);
      await fs.unlink(downloadInfo.filePath);
    } catch (error) {
      // File might already be deleted or not exist, which is fine
      console.warn(`Could not cleanup download file for job ${jobId}:`, error.message);
    }
  }
}
