import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as archiver from 'archiver';
import { JobData, JobProgress, ProcessingConfig } from '@/common/interfaces/job.interface';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly ffmpegPath: string;
  private readonly maxConcurrentJobs: number;
  private readonly jobTimeout: number;

  constructor(private configService: ConfigService) {
    this.ffmpegPath = this.configService.get('FFMPEG_PATH') || 'ffmpeg';
    this.maxConcurrentJobs = parseInt(this.configService.get('MAX_CONCURRENT_JOBS')) || 3;
    this.jobTimeout = parseInt(this.configService.get('JOB_TIMEOUT')) || 1800000; // 30 minutes

    // Set FFmpeg path
    ffmpeg.setFfmpegPath(this.ffmpegPath);
  }

  async processAudioFiles(
    jobData: JobData,
    config: ProcessingConfig,
    onProgress: (progress: JobProgress) => void,
  ): Promise<{ outputPath: string; processedFiles: string[] }> {
    const outputDir = path.join(jobData.uploadPath, 'processed');
    await fs.mkdir(outputDir, { recursive: true });

    const processedFiles: string[] = [];
    const totalFiles = jobData.mp3Files.length;

    // Load white noise file (assuming it's in assets)
    const whiteNoisePath = path.join(__dirname, '../../../assets/white-noise.mp3');

    for (let i = 0; i < totalFiles; i++) {
      const mp3File = jobData.mp3Files[i];
      const outputFileName = `processed_${mp3File.name}`;
      const outputPath = path.join(outputDir, outputFileName);

      const progress: JobProgress = {
        currentFileIndex: i,
        currentFileName: mp3File.name,
        fileProgress: 0,
        totalProgress: Math.round((i / totalFiles) * 100),
        processedFiles: i,
        totalFiles,
      };

      onProgress(progress);

      try {
        await this.processMP3WithWhiteNoise(
          mp3File.path,
          whiteNoisePath,
          outputPath,
          config.whiteNoiseVolume,
          (fileProgress) => {
            progress.fileProgress = fileProgress;
            progress.totalProgress = Math.round(((i + fileProgress / 100) / totalFiles) * 100);
            onProgress(progress);
          },
        );

        processedFiles.push(outputPath);
        this.logger.log(`Processed file ${i + 1}/${totalFiles}: ${mp3File.name}`);
      } catch (error) {
        this.logger.error(`Failed to process file ${mp3File.name}:`, error);
        throw new Error(`Failed to process file ${mp3File.name}: ${error.message}`);
      }
    }

    // Create ZIP file with processed audio
    const zipPath = await this.createZipFile(processedFiles, jobData.uploadPath, jobData.originalZipName);

    // Final progress update
    const finalProgress: JobProgress = {
      currentFileIndex: totalFiles - 1,
      currentFileName: 'Creating ZIP file...',
      fileProgress: 100,
      totalProgress: 100,
      processedFiles: totalFiles,
      totalFiles,
    };
    onProgress(finalProgress);

    return {
      outputPath: zipPath,
      processedFiles,
    };
  }

  private async processMP3WithWhiteNoise(
    mp3Path: string,
    whiteNoisePath: string,
    outputPath: string,
    volume: number,
    onProgress: (progress: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(mp3Path)
        .input(whiteNoisePath)
        .complexFilter([
          // Get duration of the main audio file
          '[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[main]',
          // Loop white noise to match main audio duration and apply volume
          `[1:a]aloop=loop=-1:size=2e+09,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=${volume}[noise]`,
          // Mix main audio with white noise
          '[main][noise]amix=inputs=2:duration=first:dropout_transition=2[out]'
        ])
        .outputOptions([
          '-map', '[out]',
          '-c:a', 'libmp3lame',
          '-b:a', '192k',
          '-ar', '44100',
          '-ac', '2'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          this.logger.debug(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            onProgress(Math.round(progress.percent));
          }
        })
        .on('end', () => {
          this.logger.debug(`FFmpeg processing completed: ${outputPath}`);
          resolve();
        })
        .on('error', (error) => {
          this.logger.error(`FFmpeg error: ${error.message}`);
          reject(error);
        });

      // Set timeout for the operation
      const timeout = setTimeout(() => {
        command.kill('SIGKILL');
        reject(new Error('FFmpeg operation timed out'));
      }, this.jobTimeout);

      command.on('end', () => clearTimeout(timeout));
      command.on('error', () => clearTimeout(timeout));

      command.run();
    });
  }

  private async createZipFile(
    filePaths: string[],
    jobDir: string,
    originalZipName: string,
  ): Promise<string> {
    const zipFileName = `processed_${originalZipName}`;
    const zipPath = path.join(jobDir, zipFileName);

    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 6 }, // Compression level
      });

      output.on('close', () => {
        this.logger.log(`ZIP file created: ${zipPath} (${archive.pointer()} bytes)`);
        resolve(zipPath);
      });

      archive.on('error', (error) => {
        this.logger.error(`ZIP creation error: ${error.message}`);
        reject(error);
      });

      archive.pipe(output);

      // Add processed files to ZIP
      for (const filePath of filePaths) {
        const fileName = path.basename(filePath);
        archive.file(filePath, { name: fileName });
      }

      archive.finalize();
    });
  }

  async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error, metadata) => {
        if (error) {
          reject(error);
          return;
        }

        const duration = metadata.format.duration;
        resolve(duration || 0);
      });
    });
  }
}
