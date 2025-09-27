import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { StartProcessingDto } from '@/common/dto/upload.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':id')
  async getJobStatus(@Param('id') jobId: string) {
    return this.jobsService.getJobStatus(jobId);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.ACCEPTED)
  async startProcessing(
    @Param('id') jobId: string,
    @Body() config: StartProcessingDto,
  ) {
    await this.jobsService.startProcessing(jobId, config);
    return { message: 'Processing started', jobId };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelJob(@Param('id') jobId: string) {
    await this.jobsService.cancelJob(jobId);
    return { message: 'Job cancelled', jobId };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteJob(@Param('id') jobId: string) {
    await this.jobsService.deleteJob(jobId);
  }

  @Get('queue/stats')
  async getQueueStats() {
    return this.jobsService.getQueueStats();
  }
}
