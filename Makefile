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
	@if docker compose version >/dev/null 2>&1; then \
		docker compose up -d; \
	else \
		docker-compose up -d; \
	fi
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
	@if docker compose version >/dev/null 2>&1; then \
		docker compose build --no-cache; \
	else \
		docker-compose build --no-cache; \
	fi

# Clean up
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	@if docker compose version >/dev/null 2>&1; then \
		docker compose down --volumes --remove-orphans; \
	else \
		docker-compose down --volumes --remove-orphans; \
	fi
	docker system prune -f

# View logs
logs:
	@echo "📋 Viewing service logs..."
	@if docker compose version >/dev/null 2>&1; then \
		docker compose logs -f; \
	else \
		docker-compose logs -f; \
	fi

# Access backend shell
shell:
	@echo "🐚 Accessing backend shell..."
	@if docker compose version >/dev/null 2>&1; then \
		docker compose exec backend sh; \
	else \
		docker-compose exec backend sh; \
	fi

# Production deployment
deploy:
	@echo "🚀 Deploying to production..."
	@if docker compose version >/dev/null 2>&1; then \
		docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build; \
	else \
		docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build; \
	fi

# Stop services
stop:
	@echo "⏹️  Stopping services..."
	@if docker compose version >/dev/null 2>&1; then \
		docker compose down; \
	else \
		docker-compose down; \
	fi

# Restart services
restart:
	@echo "🔄 Restarting services..."
	@if docker compose version >/dev/null 2>&1; then \
		docker compose restart; \
	else \
		docker-compose restart; \
	fi

# Check service status
status:
	@echo "📊 Service status:"
	@if docker compose version >/dev/null 2>&1; then \
		docker compose ps; \
	else \
		docker-compose ps; \
	fi
