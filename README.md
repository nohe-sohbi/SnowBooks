# SnowBooks 🎧❄️

A modern web application for processing audiobook files by mixing them with white noise. Built with React frontend and NestJS backend, featuring real-time progress updates and high-quality audio processing.

## ✨ Features

- **📁 ZIP File Upload**: Upload ZIP files containing multiple MP3 audiobook files
- **🎵 White Noise Mixing**: Mix white noise with audio files at configurable volume levels
- **⚡ Real-time Processing**: Live progress updates via WebSocket connections
- **🎯 High-Quality Audio**: Native FFmpeg processing for professional results
- **📦 Batch Download**: Download all processed files as a single ZIP archive
- **🐳 Docker Ready**: Complete containerized development and production setup
- **🔄 Job Queue**: Redis-based background processing with Bull queue
- **📊 Progress Tracking**: Detailed progress information with time estimates

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components with Tailwind CSS
- **Build Tool**: Vite for fast development and optimized builds
- **WebSocket**: Socket.io client for real-time updates
- **State Management**: React hooks with custom API service layer

### Backend (NestJS + TypeScript)
- **Framework**: NestJS with TypeScript
- **Queue System**: Redis + Bull for background job processing
- **Audio Processing**: Native FFmpeg for high-quality audio mixing
- **WebSocket**: Socket.io for real-time progress updates
- **File Handling**: Multer for uploads, Archiver for ZIP creation
- **API Documentation**: Swagger/OpenAPI integration

### Infrastructure
- **Database**: Redis for job queue and session storage
- **Containerization**: Docker with multi-stage builds
- **Reverse Proxy**: Nginx for production deployment
- **Development**: Docker Compose with hot reload

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- FFmpeg (included in Docker images)

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd SnowBooks
   ```

2. **Run the setup script**:
   ```bash
   ./scripts/dev-setup.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api

### Manual Setup

1. **Start services**:
   ```bash
   docker compose up -d
   ```

2. **View logs**:
   ```bash
   docker compose logs -f
   ```

3. **Stop services**:
   ```bash
   docker compose down
   ```

## 🧪 Testing

### End-to-End Testing
```bash
./scripts/test-e2e.sh
```

### Manual Testing
1. Upload a ZIP file containing MP3 files
2. Configure white noise volume (0-100%)
3. Start processing and monitor real-time progress
4. Download the processed ZIP file

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Upload file
curl -X POST -F "file=@test.zip" http://localhost:3001/api/upload

# Check job status
curl http://localhost:3001/api/jobs/{jobId}
```

## 📁 Project Structure

```
SnowBooks/
├── app/                    # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   ├── utils/          # Utility functions
│   │   └── assets/         # Static assets
│   ├── Dockerfile
│   └── package.json
├── backend/                # NestJS backend
│   ├── src/
│   │   ├── modules/        # NestJS modules
│   │   ├── common/         # Shared interfaces/DTOs
│   │   └── config/         # Configuration files
│   ├── assets/             # Backend assets (white noise)
│   ├── Dockerfile
│   └── package.json
├── scripts/                # Development scripts
│   ├── dev-setup.sh        # Development environment setup
│   └── test-e2e.sh         # End-to-end testing
├── docker-compose.yml      # Development Docker Compose
├── docker-compose.prod.yml # Production Docker Compose
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=1073741824
FFMPEG_PATH=ffmpeg
MAX_CONCURRENT_JOBS=3
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
VITE_NODE_ENV=development
```

## 🚀 Production Deployment

### Using Docker Compose
```bash
# Build and start production services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# With SSL/HTTPS
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx
```

### Environment Setup
1. Configure production environment variables
2. Set up SSL certificates for HTTPS
3. Configure reverse proxy settings
4. Set up monitoring and logging

## 🛠️ Development

### Local Development (without Docker)

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd app
npm install
npm run dev
```

#### Redis
```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or install locally
redis-server
```

### Debugging
- Backend debugging port: 9229 (when using Docker)
- Frontend hot reload: Enabled by default
- Redis CLI: `docker compose exec redis redis-cli`

## 📊 Monitoring

### Health Checks
- Backend: `GET /api/health`
- Frontend: HTTP 200 on root path
- Redis: `PING` command

### Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f redis
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `./scripts/test-e2e.sh`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- FFmpeg for audio processing capabilities
- NestJS and React communities for excellent frameworks
- shadcn/ui for beautiful UI components
- Bull Queue for reliable job processing
