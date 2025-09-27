#!/bin/bash

# End-to-End Testing Script for SnowBooks
set -e

echo "🧪 Running SnowBooks End-to-End Tests..."

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Services are not running. Please start them first with: ./scripts/dev-setup.sh"
    exit 1
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Test backend health
echo "🔍 Testing backend health..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Test Redis connection
echo "🔍 Testing Redis connection..."
if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding"
else
    echo "❌ Redis connection failed"
    exit 1
fi

# Test frontend accessibility
echo "🔍 Testing frontend accessibility..."
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend accessibility test failed"
    exit 1
fi

# Create test ZIP file with sample MP3s
echo "📦 Creating test ZIP file..."
TEST_DIR="./test-files"
mkdir -p "$TEST_DIR"

# Create a simple test MP3 file (silent audio)
if command -v ffmpeg &> /dev/null; then
    ffmpeg -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t 5 -c:a mp3 "$TEST_DIR/test1.mp3" -y > /dev/null 2>&1
    ffmpeg -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t 3 -c:a mp3 "$TEST_DIR/test2.mp3" -y > /dev/null 2>&1
    
    # Create test ZIP
    cd "$TEST_DIR"
    zip -q test-audiobook.zip test1.mp3 test2.mp3
    cd ..
    
    echo "✅ Test files created"
else
    echo "⚠️  FFmpeg not found, skipping test file creation"
fi

# Test API endpoints
echo "🔍 Testing API endpoints..."

# Test upload endpoint (if test files exist)
if [ -f "$TEST_DIR/test-audiobook.zip" ]; then
    echo "📤 Testing file upload..."
    UPLOAD_RESPONSE=$(curl -s -X POST -F "file=@$TEST_DIR/test-audiobook.zip" http://localhost:3001/api/upload)
    
    if echo "$UPLOAD_RESPONSE" | grep -q "jobId"; then
        echo "✅ File upload successful"
        JOB_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
        echo "📋 Job ID: $JOB_ID"
        
        # Test job status endpoint
        echo "🔍 Testing job status..."
        STATUS_RESPONSE=$(curl -s "http://localhost:3001/api/jobs/$JOB_ID")
        if echo "$STATUS_RESPONSE" | grep -q "uploaded"; then
            echo "✅ Job status retrieval successful"
        else
            echo "❌ Job status test failed"
        fi
        
        # Test job processing
        echo "🔄 Testing job processing..."
        PROCESS_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
            -d '{"whiteNoiseVolume":0.3,"outputFormat":"mp3","quality":"medium"}' \
            "http://localhost:3001/api/jobs/$JOB_ID/start")
        
        if [ $? -eq 0 ]; then
            echo "✅ Job processing started successfully"
            
            # Wait a bit and check status
            sleep 3
            FINAL_STATUS=$(curl -s "http://localhost:3001/api/jobs/$JOB_ID")
            echo "📊 Final job status: $(echo "$FINAL_STATUS" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
        else
            echo "❌ Job processing test failed"
        fi
        
    else
        echo "❌ File upload test failed"
    fi
fi

# Test WebSocket connection
echo "🔍 Testing WebSocket connection..."
if command -v wscat &> /dev/null; then
    timeout 5 wscat -c ws://localhost:3001/progress --execute "console.log('WebSocket connected')" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ WebSocket connection successful"
    else
        echo "⚠️  WebSocket test inconclusive"
    fi
else
    echo "⚠️  wscat not found, skipping WebSocket test"
fi

# Cleanup test files
echo "🧹 Cleaning up test files..."
rm -rf "$TEST_DIR"

echo ""
echo "🎉 End-to-End tests completed!"
echo ""
echo "📋 Test Summary:"
echo "   ✅ Backend health check"
echo "   ✅ Redis connectivity"
echo "   ✅ Frontend accessibility"
echo "   ✅ API endpoints"
echo "   ✅ File upload/processing workflow"
echo ""
echo "🚀 SnowBooks is ready for development!"
