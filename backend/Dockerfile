# Development Dockerfile for SnowBooks Backend
FROM node:18-alpine

# Install FFmpeg and other dependencies
RUN apk add --no-cache \
    ffmpeg \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads temp assets

# Copy white noise asset
COPY assets/white-noise.mp3 assets/

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "start:dev"]
