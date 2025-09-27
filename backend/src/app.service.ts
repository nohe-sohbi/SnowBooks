import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SnowBooks Backend API - Audio Processing Service';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'snowbooks-backend',
      version: '1.0.0',
      uptime: process.uptime(),
    };
  }
}
