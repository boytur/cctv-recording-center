# dev.ps1 — helper to install `air` (if missing) and run it for live-reload
# This script ensures we run `air` from the server root (one level above this script).

# get script directory and set server root to parent
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverRoot = Resolve-Path (Join-Path $scriptDir '..')
Set-Location -Path $serverRoot

# ensure Go is available
if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Error "Go is not installed or not in PATH. Install Go before running this script."
    exit 1
}

# install air if missing
if (-not (Get-Command air -ErrorAction SilentlyContinue)) {
    Write-Output "Installing air (github.com/cosmtrek/air)..."
    go install github.com/cosmtrek/air/v2/cmd/air@latest
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install air. You can install it manually: go install github.com/cosmtrek/air/v2/cmd/air@latest"
        exit 1
    }
}

Write-Output "Starting air (live-reload) from $serverRoot..."
air
