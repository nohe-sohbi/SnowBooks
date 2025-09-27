# SnowBooks Development Makefile

.PHONY: help setup dev test clean build deploy logs shell

# Default target
help:
	@echo "SnowBooks Development Commands:"
	@echo ""
	@echo "  setup     - Set up development environment"
	@echo "  dev       - Start development services"
	@echo "  test      - Run end-to-end tests"
	@echo "  build     - Build all services"
	@echo "  clean     - Clean up containers and volumes"
	@echo "  logs      - View service logs"
	@echo "  shell     - Access backend shell"
	@echo "  deploy    - Deploy to production"
	@echo ""

# Development setup
setup:
	@echo "🚀 Setting up SnowBooks development environment..."
	./scripts/dev-setup.sh

# Start development services
dev:
	@echo "🐳 Starting development services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:3001"

# Run tests
test:
	@echo "🧪 Running end-to-end tests..."
	./scripts/test-e2e.sh

# Build services
build:
	@echo "🔨 Building all services..."
	docker-compose build --no-cache

# Clean up
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose down --volumes --remove-orphans
	docker system prune -f

# View logs
logs:
	@echo "📋 Viewing service logs..."
	docker-compose logs -f

# Access backend shell
shell:
	@echo "🐚 Accessing backend shell..."
	docker-compose exec backend sh

# Production deployment
deploy:
	@echo "🚀 Deploying to production..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Stop services
stop:
	@echo "⏹️  Stopping services..."
	docker-compose down

# Restart services
restart:
	@echo "🔄 Restarting services..."
	docker-compose restart

# Check service status
status:
	@echo "📊 Service status:"
	docker-compose ps
