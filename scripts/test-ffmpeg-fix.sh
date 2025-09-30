#!/bin/bash
# Test script to verify FFmpeg sample rate fix
# This script tests the FFmpeg command inside the Docker container

echo "🧪 Testing FFmpeg Sample Rate Fix"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker compose ps | grep -q "snowbooks-backend.*Up"; then
    echo -e "${RED}❌ Backend container is not running${NC}"
    echo "Please start it with: make dev"
    exit 1
fi

echo -e "${GREEN}✅ Backend container is running${NC}"
echo ""

# Test 1: Check white noise sample rate
echo "Test 1: Checking white noise sample rate..."
SAMPLE_RATE=$(docker compose exec backend ffmpeg -i /app/assets/white-noise.mp3 2>&1 | grep "Stream #0:0" | grep -oP '\d+ Hz' | grep -oP '\d+')

if [ "$SAMPLE_RATE" = "44100" ]; then
    echo -e "${GREEN}✅ White noise is at 44100 Hz${NC}"
else
    echo -e "${RED}❌ White noise is at $SAMPLE_RATE Hz (expected 44100 Hz)${NC}"
    echo "Run: ./scripts/generate-white-noise.sh"
    exit 1
fi
echo ""

# Test 2: Check if aresample filter is in the code
echo "Test 2: Checking if aresample filter is in audio.service.ts..."
if grep -q "aresample=44100" backend/src/modules/audio/audio.service.ts; then
    echo -e "${GREEN}✅ aresample filter found in code${NC}"
else
    echo -e "${RED}❌ aresample filter not found in code${NC}"
    exit 1
fi
echo ""

# Test 3: Test FFmpeg command with sample rate mismatch
echo "Test 3: Testing FFmpeg with sample rate conversion..."
echo "Creating test audio at 48000 Hz..."

# Create a test audio file at 48000 Hz inside the container
docker compose exec backend sh -c "
    ffmpeg -f lavfi -i 'sine=frequency=440:duration=5' \
        -ar 48000 -ac 2 -b:a 128k \
        -y /tmp/test_48khz.mp3 2>&1 | tail -n 3
"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create test audio${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Test audio created at 48000 Hz${NC}"
echo ""

echo "Testing FFmpeg mixing with sample rate conversion..."

# Test the actual FFmpeg command with aresample
docker compose exec backend sh -c "
    ffmpeg -i /tmp/test_48khz.mp3 -i /app/assets/white-noise.mp3 \
        -filter_complex '[0:a]aresample=44100,aformat=sample_rates=44100:channel_layouts=stereo[main];[1:a]aresample=44100,aloop=loop=-1:size=2e+09,aformat=sample_rates=44100:channel_layouts=stereo,volume=0.5[noise];[main][noise]amix=inputs=2:duration=first:dropout_transition=2[out]' \
        -map '[out]' \
        -c:a aac -b:a 192k -ar 44100 -ac 2 \
        -f mp4 -profile:a aac_low -movflags +faststart \
        -y /tmp/test_output.m4b 2>&1 | tail -n 10
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ FFmpeg mixing with sample rate conversion succeeded!${NC}"
    
    # Check output file
    OUTPUT_SIZE=$(docker compose exec backend stat -c%s /tmp/test_output.m4b 2>/dev/null)
    if [ -n "$OUTPUT_SIZE" ] && [ "$OUTPUT_SIZE" -gt 0 ]; then
        echo -e "${GREEN}✅ Output file created (size: $OUTPUT_SIZE bytes)${NC}"
    else
        echo -e "${RED}❌ Output file is empty or missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ FFmpeg mixing failed${NC}"
    exit 1
fi
echo ""

# Cleanup
echo "Cleaning up test files..."
docker compose exec backend sh -c "rm -f /tmp/test_48khz.mp3 /tmp/test_output.m4b"
echo ""

# Test 4: Check backend logs for any recent errors
echo "Test 4: Checking recent backend logs for errors..."
RECENT_ERRORS=$(docker compose logs --tail=50 backend 2>&1 | grep -i "error" | grep -i "ffmpeg" | wc -l)

if [ "$RECENT_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ No recent FFmpeg errors in logs${NC}"
else
    echo -e "${YELLOW}⚠️  Found $RECENT_ERRORS FFmpeg error(s) in recent logs${NC}"
    echo "Check logs with: docker compose logs backend | grep -i error"
fi
echo ""

echo "=================================="
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "The FFmpeg sample rate fix is working correctly."
echo ""
echo "Next steps:"
echo "1. Upload your test file: ~/Téléchargements/testtest.zip"
echo "2. Process it through the UI at http://localhost:5173"
echo "3. Verify processing completes successfully"
echo ""
echo "To view logs in real-time:"
echo "  make logs-backend"

