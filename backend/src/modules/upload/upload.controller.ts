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
        if (!file.originalname.toLowerCase().endsWith('.zip')) {
          return callback(new BadRequestException('Only ZIP files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadZip(@UploadedFile() file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const jobData = await this.uploadService.handleZipUpload(file);

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
