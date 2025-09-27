#!/bin/bash

# SnowBooks Development Setup Script
set -e

echo "🚀 Setting up SnowBooks development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads backend/temp backend/logs
mkdir -p app/dist

# Copy environment files if they don't exist
echo "⚙️  Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env 2>/dev/null || echo "Backend .env.example not found, using defaults"
fi

if [ ! -f app/.env ]; then
    cp app/.env.example app/.env 2>/dev/null || echo "Frontend .env.example not found, using defaults"
fi

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:3001"
    echo "   API Docs: http://localhost:3001/api"
    echo "   Redis:    localhost:6379"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:     docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart:       docker-compose restart"
    echo "   Shell access:  docker-compose exec backend sh"
    echo ""
    echo "🎉 Development environment is ready!"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
