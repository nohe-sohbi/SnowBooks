import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AudioService } from './audio.service';
import { AudioProcessor } from './audio.processor';
import { UploadModule } from '../upload/upload.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio-processing',
    }),
    UploadModule,
    ProgressModule,
  ],
  providers: [AudioService, AudioProcessor],
  exports: [AudioService],
})
export class AudioModule {}
