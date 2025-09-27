import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UploadResponseDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsString()
  @IsNotEmpty()
  originalZipName: string;

  @IsNumber()
  @Min(0)
  fileCount: number;

  @IsNumber()
  @Min(0)
  totalSize: number;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  createdAt: string;
}

export class StartProcessingDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  whiteNoiseVolume: number;

  @IsOptional()
  @IsString()
  outputFormat?: 'mp3' | 'wav' = 'mp3';

  @IsOptional()
  @IsString()
  quality?: 'low' | 'medium' | 'high' = 'medium';
}
