import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio-processing',
    }),
    UploadModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
