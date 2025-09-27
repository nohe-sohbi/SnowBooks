#!/bin/bash

# Test script to verify Docker Compose detection works correctly
set -e

echo "🧪 Testing Docker Compose detection..."

# Test modern Docker Compose (docker compose)
if docker compose version &> /dev/null; then
    echo "✅ Modern Docker Compose detected: 'docker compose'"
    DOCKER_COMPOSE_CMD="docker compose"
    docker compose version
elif command -v docker-compose &> /dev/null; then
    echo "✅ Legacy Docker Compose detected: 'docker-compose'"
    DOCKER_COMPOSE_CMD="docker-compose"
    docker-compose version
else
    echo "❌ No Docker Compose found!"
    exit 1
fi

echo ""
echo "🔍 Testing Docker Compose command: $DOCKER_COMPOSE_CMD"

# Test basic commands
echo "📋 Testing 'ps' command..."
if $DOCKER_COMPOSE_CMD ps &> /dev/null; then
    echo "✅ 'ps' command works"
else
    echo "⚠️  'ps' command failed (this is normal if no services are running)"
fi

echo "📋 Testing 'config' command..."
if $DOCKER_COMPOSE_CMD config &> /dev/null; then
    echo "✅ 'config' command works"
else
    echo "❌ 'config' command failed"
    exit 1
fi

echo ""
echo "🎉 Docker Compose detection test completed successfully!"
echo "   Using command: $DOCKER_COMPOSE_CMD"
