# SnowBooks Backend

NestJS backend service for SnowBooks audio processing application.

## Features

- **File Upload**: Handle ZIP files containing MP3 audio files
- **Audio Processing**: Mix MP3 files with white noise using native FFmpeg
- **Job Queue**: Redis-based job queue for background processing
- **Real-time Progress**: WebSocket support for live progress updates
- **File Download**: Serve processed audio files as ZIP downloads

## Technology Stack

- **Framework**: NestJS with TypeScript
- **Queue**: Redis + Bull for job management
- **Audio Processing**: Native FFmpeg
- **WebSockets**: Socket.io for real-time updates
- **File Handling**: Multer for uploads, Archiver for ZIP creation

## Quick Start

### Using Docker (Recommended)

1. **Start services**:
   ```bash
   docker-compose up -d
   ```

2. **View logs**:
   ```bash
   docker-compose logs -f backend
   ```

### Manual Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Redis**:
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:7-alpine
   
   # Or install locally
   redis-server
   ```

3. **Install FFmpeg**:
   ```bash
   # Ubuntu/Debian
   sudo apt install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development server**:
   ```bash
   npm run start:dev
   ```

## API Endpoints

### Upload
- `POST /api/upload` - Upload ZIP file containing MP3s

### Jobs
- `GET /api/jobs/:id` - Get job status
- `POST /api/jobs/:id/start` - Start processing job
- `POST /api/jobs/:id/cancel` - Cancel job
- `DELETE /api/jobs/:id` - Delete job and cleanup files

### Download
- `GET /api/download/:id` - Download processed ZIP file
- `GET /api/download/:id/info` - Get file information

### Health
- `GET /api/health` - Health check endpoint

## WebSocket Events

Connect to `/progress` namespace:

### Client Events
- `subscribe-to-job` - Subscribe to job progress updates
- `unsubscribe-from-job` - Unsubscribe from job updates

### Server Events
- `progress-update` - Real-time progress updates
- `job-completed` - Job completion notification
- `job-error` - Job error notification

## Development

### Project Structure
```
src/
├── modules/
│   ├── upload/          # File upload handling
│   ├── jobs/            # Job management
│   ├── audio/           # Audio processing
│   ├── progress/        # WebSocket progress updates
│   └── download/        # File download serving
├── common/
│   ├── interfaces/      # TypeScript interfaces
│   └── dto/            # Data transfer objects
└── config/             # Configuration files
```

### Environment Variables

See `.env.example` for all available configuration options.

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Production Deployment

1. **Build application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm run start:prod
   ```

3. **Use PM2 for process management**:
   ```bash
   npm install -g pm2
   pm2 start dist/main.js --name snowbooks-backend
   ```

## Monitoring

- Health check: `GET /api/health`
- Queue stats: `GET /api/jobs/queue/stats`
- WebSocket stats: Available through ProgressGateway

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure FFmpeg is installed and in PATH
2. **Redis connection failed**: Check Redis server is running
3. **File upload fails**: Check MAX_FILE_SIZE configuration
4. **WebSocket connection issues**: Verify CORS configuration

### Logs

Development logs are output to console. In production, configure proper logging with log levels.
