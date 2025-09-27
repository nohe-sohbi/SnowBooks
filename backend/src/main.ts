import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    credentials: configService.get('CORS_CREDENTIALS') === 'true',
  });

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 SnowBooks Backend running on port ${port}`);
  console.log(`📡 WebSocket server ready for real-time progress updates`);
  console.log(`🎵 FFmpeg audio processing service initialized`);
}

bootstrap();
