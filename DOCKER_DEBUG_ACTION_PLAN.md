# 🎯 Docker Debugging Action Plan - FFmpeg Exit Code 234

## 🚨 Current Situation

**Problem:** FFmpeg exits with code 234 (Conversion failed) when processing "00 - Précédemment.mp3"

**Environment:** Docker containers (backend, frontend, redis)

**What We Know:**
- ✅ Filename sanitization is working (preview works)
- ✅ Job status management is fixed (can retry)
- ✅ File paths are being constructed correctly
- ❌ FFmpeg encoding is failing during conversion

---

## 📋 Immediate Action Steps

### Step 1: View Backend Logs (RIGHT NOW!)

```bash
# Open a new terminal and run:
make logs-backend

# Or:
docker compose logs -f backend
```

**What to look for:**
- `[AudioService] FFmpeg command: ...` - The exact command being run
- `[AudioService] FFmpeg stderr: ...` - **THE ACTUAL ERROR MESSAGE**
- `[AudioService] White noise path: ...` - Verify path is correct

### Step 2: Run FFmpeg Diagnostics

```bash
# In another terminal:
make debug-ffmpeg
```

This will:
- ✅ Check if FFmpeg is installed
- ✅ Verify AAC codec support
- ✅ Test white noise file
- ✅ Test simple AAC encoding
- ✅ Test complex filter with mixing

### Step 3: Access Container Shell (If Needed)

```bash
make shell
```

Inside the container, you can:
```bash
# Check white noise file
ls -la /app/assets/white-noise.mp3
cat /app/assets/white-noise.mp3 > /dev/null && echo "OK" || echo "FAIL"

# Check FFmpeg
ffmpeg -version
ffmpeg -codecs | grep aac

# Find your job directory
ls -la /app/uploads/

# Check uploaded files (replace JOB_ID with actual ID)
ls -la /app/uploads/<JOB_ID>/extracted/
```

---

## 🔍 What the Enhanced Logging Will Show

With the fixes we implemented, you should now see:

### Success Case:
```
[AudioService] === Processing file 1/3 ===
[AudioService] Original filename: "00 - Précédemment.mp3"
[AudioService] Sanitized filename result: "00_-_Precedemment"
[AudioService] White noise path: "/app/assets/white-noise.mp3"
[AudioService] White noise file exists and is accessible
[AudioService] Complex filter: ["[0:a]aformat=sample_rates=44100:channel_layouts=stereo[main]",...]
[AudioService] Output options: ["-ar","44100","-ac","2","-c:a","aac","-b:a","192k","-f","mp4","-movflags","+faststart","-profile:a","aac_low"]
[AudioService] FFmpeg command: ffmpeg -i /app/uploads/.../00 - Précédemment.mp3 -i /app/assets/white-noise.mp3 -filter_complex ...
[AudioService] FFmpeg processing completed: /app/uploads/.../processed_00_-_Precedemment.m4b
```

### Failure Case (What We Need to See):
```
[AudioService] FFmpeg error: ffmpeg exited with code 234: Conversion failed!
[AudioService] FFmpeg stderr: [ACTUAL ERROR MESSAGE HERE]
[AudioService] FFmpeg stdout: [OUTPUT HERE]
[AudioService] Input path: /app/uploads/.../00 - Précédemment.mp3
[AudioService] Output path: /app/uploads/.../processed_00_-_Precedemment.m4b
[AudioService] Format: m4b
```

**The FFmpeg stderr line is CRITICAL** - it will tell us exactly what's wrong!

---

## 🐛 Common Issues & Quick Fixes

### Issue 1: White Noise File Missing in Container

**Symptom:** `White noise file not found at: /app/assets/white-noise.mp3`

**Fix:**
```bash
# Rebuild container to copy assets
make build
make dev
```

### Issue 2: FFmpeg Not Installed or Wrong Version

**Symptom:** `ffmpeg: not found` or AAC codec missing

**Fix:** Check Dockerfile - Alpine FFmpeg should have AAC support
```bash
# Inside container:
ffmpeg -codecs | grep -i aac
# Should show: DEA.L. aac
```

### Issue 3: File Permission Issues

**Symptom:** FFmpeg can't read input or write output

**Fix:**
```bash
# Inside container:
chmod -R 755 /app/uploads/
```

### Issue 4: Complex Filter Syntax Error

**Symptom:** FFmpeg stderr shows "Invalid filter" or "No such filter"

**Fix:** We simplified the filter syntax, but if still failing:
```bash
# Test manually inside container with simpler filter
ffmpeg -i input.mp3 -i white-noise.mp3 \
  -filter_complex "[0:a][1:a]amix=inputs=2:duration=first[out]" \
  -map "[out]" -c:a aac -b:a 192k output.m4b
```

---

## 🎬 What to Do Next

### Immediate Actions (Do These Now):

1. **Open Terminal 1:**
   ```bash
   cd /home/user/Documents/PARA/Projets/Main/SnowBooks
   make logs-backend
   ```
   Keep this running to see real-time logs

2. **Open Terminal 2:**
   ```bash
   cd /home/user/Documents/PARA/Projets/Main/SnowBooks
   make debug-ffmpeg
   ```
   Run diagnostics

3. **In Browser:**
   - Go to http://localhost:5173
   - Try processing the file again
   - Watch Terminal 1 for logs

4. **Look for FFmpeg stderr:**
   - This will tell us the EXACT error
   - Share this output for further diagnosis

### If Diagnostics Pass But Processing Still Fails:

The issue is likely with:
- Specific file characteristics (encoding, sample rate, etc.)
- Path escaping in the actual command
- Metadata handling

**Next step:** Share the FFmpeg stderr output from the logs

### If Diagnostics Fail:

We need to fix the Docker environment:
- Rebuild container with proper FFmpeg
- Verify asset files are copied correctly
- Check volume mounts

---

## 📊 Expected Diagnostic Results

When you run `make debug-ffmpeg`, you should see:

```
🔍 SnowBooks FFmpeg Debugging Script
====================================

1️⃣  Checking FFmpeg installation...
✅ FFmpeg is installed
ffmpeg version 6.0

2️⃣  Checking AAC codec support...
✅ AAC codec is available
DEA.L. aac                  AAC (Advanced Audio Coding)

3️⃣  Checking white noise file...
✅ White noise file exists
-rw-r--r--    1 node     node       1.2M Jan 15 10:00 /app/assets/white-noise.mp3
✅ White noise file is valid

4️⃣  Checking upload directory...
✅ Upload directory exists

5️⃣  Testing simple AAC encoding...
✅ AAC encoding test PASSED

6️⃣  Testing complex filter with mixing...
✅ Complex filter test PASSED

====================================
🏁 Debugging complete!
```

If all tests pass, the issue is with the specific file or command construction.

---

## 🆘 If You're Stuck

**Share these outputs:**

1. **Backend logs with FFmpeg stderr:**
   ```bash
   docker compose logs backend | grep -A 20 "FFmpeg stderr"
   ```

2. **Diagnostic results:**
   ```bash
   make debug-ffmpeg
   ```

3. **Container file listing:**
   ```bash
   docker compose exec backend ls -la /app/assets/
   docker compose exec backend ls -la /app/uploads/
   ```

---

## 🔄 Quick Restart Commands

```bash
# Restart backend only (fast)
docker compose restart backend

# Rebuild everything (if code changed)
make build && make dev

# Nuclear option (clean slate)
make clean && make build && make dev
```

---

## ✅ Success Criteria

You'll know it's working when:
- ✅ No "White noise file not found" errors
- ✅ FFmpeg command appears in logs
- ✅ No FFmpeg stderr errors
- ✅ "FFmpeg processing completed" message appears
- ✅ Processed files appear in download step

---

**🎯 ACTION NOW:** Run `make logs-backend` and `make debug-ffmpeg` to see what's happening!

