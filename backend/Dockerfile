# Development Dockerfile for SnowBooks Backend
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads temp

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "start:dev"]
