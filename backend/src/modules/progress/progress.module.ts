import { Module } from '@nestjs/common';
import { ProgressGateway } from './progress.gateway';
import { ProgressService } from './progress.service';

@Module({
  providers: [ProgressGateway, ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
