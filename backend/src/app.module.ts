import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Import custom modules
import { UploadModule } from './modules/upload/upload.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { AudioModule } from './modules/audio/audio.module';
import { ProgressModule } from './modules/progress/progress.module';
import { DownloadModule } from './modules/download/download.module';

// Import configuration
import { redisConfig } from './config/redis.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Redis and Bull queue configuration
    BullModule.forRootAsync({
      useFactory: () => redisConfig,
    }),

    // Serve static files for downloads
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/files',
    }),

    // Feature modules
    UploadModule,
    JobsModule,
    AudioModule,
    ProgressModule,
    DownloadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
