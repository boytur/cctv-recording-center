package stream

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
)

type manager struct {
	mu    sync.Mutex
	procs map[string]*exec.Cmd
}

var m = &manager{procs: make(map[string]*exec.Cmd)}

// StartHLS starts an ffmpeg process to transcode `rtsp` into HLS files under data/streams/{id}.
// If a process is already running for the id, it is left running.
func StartHLS(id, rtsp string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if cmd, ok := m.procs[id]; ok {
		if cmd.Process != nil {
			// already running
			return fmt.Sprintf("/stream_hls/%s/index.m3u8", id), nil
		}
	}

	outDir := filepath.Join("data", "streams", id)
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return "", err
	}
	outPath := filepath.Join(outDir, "index.m3u8")

	// build ffmpeg command
	// -rtsp_transport tcp ensures stable RTSP transport
	args := []string{
		"-rtsp_transport", "tcp",
		"-i", rtsp,
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-tune", "zerolatency",
		"-c:a", "aac",
		"-ar", "44100",
		"-b:a", "96k",
		"-f", "hls",
		"-hls_time", "2",
		"-hls_list_size", "3",
		"-hls_flags", "delete_segments+append_list",
		outPath,
	}

	ctx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(ctx, "ffmpeg", args...)
	// Capture stderr for debugging
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		cancel()
		return "", fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	// store process and keep cancel function in a goroutine that waits
	m.procs[id] = cmd
	go func() {
		// wait for process to exit
		_ = cmd.Wait()
		m.mu.Lock()
		delete(m.procs, id)
		m.mu.Unlock()
		cancel()
	}()

	// return public URL
	return fmt.Sprintf("/stream_hls/%s/index.m3u8", id), nil
}

// StopHLS attempts to kill the running ffmpeg process for id.
func StopHLS(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	cmd, ok := m.procs[id]
	if !ok || cmd == nil || cmd.Process == nil {
		return nil
	}
	// attempt graceful kill
	if err := cmd.Process.Kill(); err != nil {
		return err
	}
	delete(m.procs, id)
	return nil
}
