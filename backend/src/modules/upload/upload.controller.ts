import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadResponseDto } from '@/common/dto/upload.dto';
import { isArchiveFile, isMediaFile } from '@/common/media-types';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024; // 5GB — large enough for films

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_UPLOAD_SIZE,
      },
      fileFilter: (req, file, callback) => {
        if (!isArchiveFile(file.originalname) && !isMediaFile(file.originalname)) {
          return callback(
            new BadRequestException('Only ZIP/RAR archives or audio/video files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadZip(@UploadedFile() file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const jobData = await this.uploadService.handleArchiveUpload(file);

    return {
      jobId: jobData.id,
      originalZipName: jobData.originalZipName,
      fileCount: jobData.mp3Files.length,
      totalSize: jobData.mp3Files.reduce((sum, file) => sum + file.size, 0),
      status: jobData.status,
      createdAt: jobData.createdAt.toISOString(),
    };
  }
}
