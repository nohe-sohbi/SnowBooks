# 🐳 Docker Environment Debugging Guide for SnowBooks

## Quick Commands Reference

### View Backend Logs (Real-Time)
```bash
# View all logs
make logs

# View only backend logs
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail=100 backend
```

### Access Backend Container Shell
```bash
# Using Makefile
make shell

# Direct command
docker compose exec backend sh
```

### Check Service Status
```bash
make status
# or
docker compose ps
```

---

## Step-by-Step Debugging Process

### 1. Check Backend Container Logs

First, let's see what FFmpeg is actually doing:

```bash
# In your terminal, run:
docker compose logs -f backend
```

**Look for these log entries:**
- `[AudioService] White noise path: ...`
- `[AudioService] FFmpeg command: ...`
- `[AudioService] FFmpeg stderr: ...` (THIS IS THE KEY!)
- `[AudioService] FFmpeg error: ...`

### 2. Access Backend Container

```bash
# Open a shell in the backend container
make shell
# or
docker compose exec backend sh
```

### 3. Inside Container: Verify File Paths

Once inside the container, run these commands:

```bash
# Check current directory
pwd
# Should show: /app

# Check if white noise file exists
ls -la assets/white-noise.mp3
# Should show the file with size

# Check if FFmpeg is installed
which ffmpeg
# Should show: /usr/bin/ffmpeg

# Check FFmpeg version and codecs
ffmpeg -version
ffmpeg -codecs | grep aac
# Should show AAC codec support

# Check upload directory
ls -la uploads/
# Should show job directories

# Find a job directory (replace with actual job ID)
ls -la uploads/<JOB_ID>/extracted/
# Should show your MP3 files
```

### 4. Test FFmpeg Manually Inside Container

```bash
# Inside the container, test a simple FFmpeg command
cd /app

# Test 1: Check if input file is readable
ffmpeg -i uploads/<JOB_ID>/extracted/00\ -\ Précédemment.mp3 -f null -

# Test 2: Test AAC encoding
ffmpeg -i uploads/<JOB_ID>/extracted/00\ -\ Précédemment.mp3 \
  -c:a aac -b:a 192k -f mp4 /tmp/test.m4b

# Test 3: Test with white noise mixing
ffmpeg -i uploads/<JOB_ID>/extracted/00\ -\ Précédemment.mp3 \
  -i assets/white-noise.mp3 \
  -filter_complex "[0:a]aformat=sample_rates=44100:channel_layouts=stereo[main];[1:a]aloop=loop=-1:size=2e+09,aformat=sample_rates=44100:channel_layouts=stereo,volume=1.0[noise];[main][noise]amix=inputs=2:duration=first:dropout_transition=2[out]" \
  -map "[out]" \
  -c:a aac -b:a 192k -f mp4 /tmp/test_mixed.m4b
```

### 5. Check File Permissions

```bash
# Inside container
ls -la uploads/<JOB_ID>/
ls -la uploads/<JOB_ID>/extracted/
ls -la assets/

# Check if files are readable
cat assets/white-noise.mp3 > /dev/null && echo "White noise readable" || echo "White noise NOT readable"
```

---

## Common Issues & Solutions

### Issue 1: White Noise File Not Found

**Symptom:** Logs show "White noise file not found"

**Solution:**
```bash
# Check if file exists in container
docker compose exec backend ls -la /app/assets/white-noise.mp3

# If missing, rebuild container
make build
make dev
```

### Issue 2: FFmpeg AAC Codec Not Available

**Symptom:** FFmpeg stderr shows "Unknown encoder 'aac'"

**Solution:**
```bash
# Check FFmpeg build
docker compose exec backend ffmpeg -codecs | grep aac

# If AAC not available, update Dockerfile to use full FFmpeg build
# (Alpine's FFmpeg should have AAC support by default)
```

### Issue 3: File Permission Issues

**Symptom:** FFmpeg can't read input or write output

**Solution:**
```bash
# Inside container, check permissions
ls -la uploads/<JOB_ID>/extracted/

# Fix permissions if needed
chmod -R 755 uploads/
```

### Issue 4: Complex Filter Syntax Error

**Symptom:** FFmpeg stderr shows filter-related errors

**Solution:** Check the FFmpeg command in logs and test manually with simplified filter

---

## Rebuild and Restart

If you make changes to the code:

```bash
# Restart backend only (fast)
docker compose restart backend

# Rebuild and restart (if Dockerfile changed)
make build
make dev

# Clean rebuild (nuclear option)
make clean
make build
make dev
```

---

## View Specific Error Details

After processing fails, check logs:

```bash
# Get last 50 lines of backend logs
docker compose logs --tail=50 backend

# Search for FFmpeg errors
docker compose logs backend | grep -A 10 "FFmpeg error"
docker compose logs backend | grep -A 10 "FFmpeg stderr"
```

---

## Expected Log Output (Success)

When processing works correctly, you should see:

```
[AudioService] === Processing file 1/3 ===
[AudioService] Original filename: "00 - Précédemment.mp3"
[AudioService] Sanitized filename result: "00_-_Precedemment"
[AudioService] White noise path: "/app/assets/white-noise.mp3"
[AudioService] White noise file exists and is accessible
[AudioService] Complex filter: [...]
[AudioService] Output options: ["-ar","44100","-ac","2","-c:a","aac",...]
[AudioService] FFmpeg command: ffmpeg -i /app/uploads/.../00 - Précédemment.mp3 ...
[AudioService] FFmpeg processing completed: /app/uploads/.../processed_00_-_Precedemment.m4b
```

---

## Next Steps

1. **Run:** `docker compose logs -f backend`
2. **Try processing** your file again
3. **Look for** the FFmpeg stderr output in the logs
4. **Share** the FFmpeg stderr content for further diagnosis

The enhanced logging we added will show the EXACT FFmpeg error message!

