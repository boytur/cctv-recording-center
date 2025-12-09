# FFmpeg Installation Guide for Windows

FFmpeg is required for transcoding RTSP streams to HLS format.

## Installation Options

### Option 1: Using Chocolatey (Recommended)

1. Install Chocolatey if not already installed:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. Install FFmpeg:
   ```powershell
   choco install ffmpeg -y
   ```

3. Restart your terminal and verify:
   ```powershell
   ffmpeg -version
   ```

### Option 2: Manual Installation

1. Download FFmpeg from: https://www.gyan.dev/ffmpeg/builds/
   - Choose "ffmpeg-release-essentials.zip"

2. Extract the ZIP file to `C:\ffmpeg`

3. Add to PATH:
   - Open System Properties → Environment Variables
   - Edit "Path" under System variables
   - Add: `C:\ffmpeg\bin`
   - Click OK

4. Restart your terminal and verify:
   ```powershell
   ffmpeg -version
   ```

### Option 3: Using Scoop

1. Install Scoop if not already installed:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. Install FFmpeg:
   ```powershell
   scoop install ffmpeg
   ```

3. Verify:
   ```powershell
   ffmpeg -version
   ```

## After Installation

Once FFmpeg is installed, restart the Go server:

```powershell
cd server
go run cmd/server/main.go
```

The video stream should now work properly!
