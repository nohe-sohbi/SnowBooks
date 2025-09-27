import {
  Controller,
  Get,
  Param,
  Res,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get(':id')
  async downloadFile(@Param('id') jobId: string, @Res({ passthrough: true }) res: Response) {
    const downloadInfo = await this.downloadService.getDownloadFile(jobId);
    
    // Set response headers
    res.set({
      'Content-Type': downloadInfo.mimeType,
      'Content-Disposition': `attachment; filename="${downloadInfo.fileName}"`,
    });

    // Create and return streamable file
    const file = createReadStream(downloadInfo.filePath);
    return new StreamableFile(file);
  }

  @Get(':id/info')
  async getFileInfo(@Param('id') jobId: string) {
    return this.downloadService.getFileStats(jobId);
  }
}
