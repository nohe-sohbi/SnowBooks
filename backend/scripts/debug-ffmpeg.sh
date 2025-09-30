#!/bin/sh
# FFmpeg Debugging Script for Docker Container
# Run this inside the backend container: docker compose exec backend sh debug-ffmpeg.sh

echo "🔍 SnowBooks FFmpeg Debugging Script"
echo "===================================="
echo ""

# Check FFmpeg installation
echo "1️⃣  Checking FFmpeg installation..."
if command -v ffmpeg >/dev/null 2>&1; then
    echo "✅ FFmpeg is installed"
    ffmpeg -version | head -n 1
else
    echo "❌ FFmpeg is NOT installed"
    exit 1
fi
echo ""

# Check AAC codec support
echo "2️⃣  Checking AAC codec support..."
if ffmpeg -codecs 2>/dev/null | grep -q "aac"; then
    echo "✅ AAC codec is available"
    ffmpeg -codecs 2>/dev/null | grep "DEA" | grep "aac"
else
    echo "❌ AAC codec is NOT available"
fi
echo ""

# Check white noise file
echo "3️⃣  Checking white noise file..."
if [ -f "/app/assets/white-noise.mp3" ]; then
    echo "✅ White noise file exists"
    ls -lh /app/assets/white-noise.mp3
    
    # Test if file is valid
    echo "   Testing file validity..."
    if ffmpeg -i /app/assets/white-noise.mp3 -f null - 2>&1 | grep -q "Duration"; then
        echo "✅ White noise file is valid"
    else
        echo "❌ White noise file is corrupted"
    fi
else
    echo "❌ White noise file NOT found at /app/assets/white-noise.mp3"
fi
echo ""

# Check upload directory
echo "4️⃣  Checking upload directory..."
if [ -d "/app/uploads" ]; then
    echo "✅ Upload directory exists"
    echo "   Contents:"
    ls -la /app/uploads/ | head -n 10
    
    # Find most recent job
    LATEST_JOB=$(ls -t /app/uploads/ | head -n 1)
    if [ -n "$LATEST_JOB" ]; then
        echo ""
        echo "   Latest job: $LATEST_JOB"
        if [ -d "/app/uploads/$LATEST_JOB/extracted" ]; then
            echo "   Extracted files:"
            ls -lh /app/uploads/$LATEST_JOB/extracted/
        fi
    fi
else
    echo "❌ Upload directory NOT found"
fi
echo ""

# Test simple AAC encoding
echo "5️⃣  Testing simple AAC encoding..."
TEST_INPUT="/app/assets/white-noise.mp3"
TEST_OUTPUT="/tmp/test-aac.m4b"

echo "   Running: ffmpeg -i $TEST_INPUT -c:a aac -b:a 192k -f mp4 $TEST_OUTPUT"
if ffmpeg -i "$TEST_INPUT" -c:a aac -b:a 192k -f mp4 -y "$TEST_OUTPUT" 2>&1 | tail -n 5; then
    if [ -f "$TEST_OUTPUT" ]; then
        echo "✅ AAC encoding test PASSED"
        ls -lh "$TEST_OUTPUT"
        rm "$TEST_OUTPUT"
    else
        echo "❌ AAC encoding test FAILED - output file not created"
    fi
else
    echo "❌ AAC encoding test FAILED"
fi
echo ""

# Test complex filter
echo "6️⃣  Testing complex filter with mixing..."
TEST_OUTPUT="/tmp/test-mixed.m4b"

echo "   Running complex filter test..."
ffmpeg -i "$TEST_INPUT" -i "$TEST_INPUT" \
    -filter_complex "[0:a]aformat=sample_rates=44100:channel_layouts=stereo[main];[1:a]aloop=loop=-1:size=2e+09,aformat=sample_rates=44100:channel_layouts=stereo,volume=0.5[noise];[main][noise]amix=inputs=2:duration=first:dropout_transition=2[out]" \
    -map "[out]" \
    -c:a aac -b:a 192k -ar 44100 -ac 2 -f mp4 -profile:a aac_low -movflags +faststart \
    -y "$TEST_OUTPUT" 2>&1 | tail -n 10

if [ -f "$TEST_OUTPUT" ]; then
    echo "✅ Complex filter test PASSED"
    ls -lh "$TEST_OUTPUT"
    rm "$TEST_OUTPUT"
else
    echo "❌ Complex filter test FAILED"
fi
echo ""

echo "===================================="
echo "🏁 Debugging complete!"
echo ""
echo "Next steps:"
echo "1. If all tests passed, the issue might be with specific file paths"
echo "2. Check the actual FFmpeg command in the logs: docker compose logs backend | grep 'FFmpeg command'"
echo "3. Check FFmpeg stderr: docker compose logs backend | grep 'FFmpeg stderr'"
echo "4. Try processing again and watch logs: docker compose logs -f backend"

