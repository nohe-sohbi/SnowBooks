#!/bin/bash
# Test script to upload and process the user's test file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing M4B Processing with User's Test File"
echo "================================================"
echo ""

# Check if test file exists
TEST_FILE="/home/user/Téléchargements/testtest.zip"
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}❌ Test file not found: $TEST_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Test file found: $TEST_FILE${NC}"
echo ""

# Wait for backend to be healthy
echo "Waiting for backend to be healthy..."
MAX_WAIT=30
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker compose exec backend sh -c "curl -s http://localhost:3001/health > /dev/null 2>&1"; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        break
    fi
    sleep 1
    WAITED=$((WAITED + 1))
    echo -n "."
done

if [ $WAITED -eq $MAX_WAIT ]; then
    echo -e "${RED}❌ Backend did not become healthy in time${NC}"
    exit 1
fi
echo ""

# Upload the file
echo "Uploading test file..."
UPLOAD_RESPONSE=$(curl -s -X POST \
  -F "file=@$TEST_FILE" \
  http://localhost:3001/api/upload)

echo "Upload response: $UPLOAD_RESPONSE"
echo ""

# Extract job ID
JOB_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    echo -e "${RED}❌ Failed to extract job ID from upload response${NC}"
    exit 1
fi

echo -e "${GREEN}✅ File uploaded successfully${NC}"
echo "Job ID: $JOB_ID"
echo ""

# Start processing
echo "Starting M4B processing with 100% white noise volume..."
PROCESS_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"whiteNoiseVolume\":1.0,\"outputFormat\":\"m4b\",\"quality\":\"medium\"}" \
  http://localhost:3001/api/jobs/$JOB_ID/start)

echo "Process response: $PROCESS_RESPONSE"
echo ""

# Monitor progress
echo "Monitoring processing progress..."
echo "Watching backend logs for FFmpeg output..."
echo ""

# Follow logs for 60 seconds or until completion/error
timeout 60 docker compose logs -f backend 2>&1 | while read line; do
    echo "$line"
    
    # Check for completion
    if echo "$line" | grep -q "Audio processing completed for job $JOB_ID"; then
        echo ""
        echo -e "${GREEN}✅ Processing completed successfully!${NC}"
        pkill -P $$ docker
        break
    fi
    
    # Check for errors
    if echo "$line" | grep -q "Audio processing failed for job $JOB_ID"; then
        echo ""
        echo -e "${RED}❌ Processing failed!${NC}"
        pkill -P $$ docker
        break
    fi
    
    # Check for FFmpeg errors
    if echo "$line" | grep -q "FFmpeg error"; then
        echo ""
        echo -e "${RED}❌ FFmpeg error detected!${NC}"
    fi
done

echo ""
echo "Test complete!"
echo ""
echo "To check the final status, run:"
echo "  curl http://localhost:3001/api/jobs/$JOB_ID"

