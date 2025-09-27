#!/bin/bash

# SnowBooks Development Setup Script
set -e

echo "🚀 Setting up SnowBooks development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed (modern Docker includes compose as a subcommand)
if ! docker compose version &> /dev/null; then
    # Fallback to legacy docker-compose command
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        echo "   Modern Docker: 'docker compose' subcommand"
        echo "   Legacy: 'docker-compose' standalone command"
        exit 1
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

echo "✅ Using Docker Compose command: $DOCKER_COMPOSE_CMD"

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
$DOCKER_COMPOSE_CMD down --remove-orphans
$DOCKER_COMPOSE_CMD build --no-cache
$DOCKER_COMPOSE_CMD up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:3001"
    echo "   API Docs: http://localhost:3001/api"
    echo "   Redis:    localhost:6379"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:     $DOCKER_COMPOSE_CMD logs -f"
    echo "   Stop services: $DOCKER_COMPOSE_CMD down"
    echo "   Restart:       $DOCKER_COMPOSE_CMD restart"
    echo "   Shell access:  $DOCKER_COMPOSE_CMD exec backend sh"
    echo ""
    echo "🎉 Development environment is ready!"
else
    echo "❌ Some services failed to start. Check logs with: $DOCKER_COMPOSE_CMD logs"
    exit 1
fi
