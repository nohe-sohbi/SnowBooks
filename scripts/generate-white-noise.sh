#!/bin/bash
# Generate white noise audio file at 44100 Hz for SnowBooks
# This ensures sample rate compatibility with most audiobooks

echo "🎵 Generating white noise audio file..."
echo "Sample rate: 44100 Hz"
echo "Duration: 45 minutes"
echo "Format: MP3"
echo ""

# Output paths
BACKEND_OUTPUT="backend/assets/white-noise.mp3"
FRONTEND_OUTPUT="app/src/assets/white-noise.mp3"

# Generate white noise using FFmpeg
# -f lavfi: Use libavfilter virtual input
# -i anoisesrc: Generate white noise
# -ar 44100: Sample rate 44100 Hz (standard for most audio)
# -ac 2: Stereo (2 channels)
# -t 2700: Duration 45 minutes (2700 seconds)
# -b:a 192k: Bitrate 192 kbps
# -y: Overwrite output file

echo "Generating white noise..."
ffmpeg -f lavfi -i anoisesrc=duration=2700:color=white:sample_rate=44100:amplitude=0.5 \
  -ar 44100 \
  -ac 2 \
  -b:a 192k \
  -y "$BACKEND_OUTPUT"

if [ $? -eq 0 ]; then
    echo "✅ Backend white noise generated successfully"
    ls -lh "$BACKEND_OUTPUT"
    
    # Copy to frontend
    cp "$BACKEND_OUTPUT" "$FRONTEND_OUTPUT"
    echo "✅ Copied to frontend assets"
    
    # Verify the file
    echo ""
    echo "Verifying file properties..."
    ffmpeg -i "$BACKEND_OUTPUT" 2>&1 | grep -E "(Duration|Stream|Audio)"
    
    echo ""
    echo "✅ White noise generation complete!"
    echo ""
    echo "Next steps:"
    echo "1. Rebuild Docker containers: make build"
    echo "2. Restart services: make dev"
else
    echo "❌ Failed to generate white noise"
    exit 1
fi

