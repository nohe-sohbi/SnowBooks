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

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1073741824, // 1GB
      },
      fileFilter: (req, file, callback) => {
        const name = file.originalname.toLowerCase();
        if (!name.endsWith('.zip') && !name.endsWith('.rar')) {
          return callback(new BadRequestException('Only ZIP and RAR files are allowed'), false);
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
