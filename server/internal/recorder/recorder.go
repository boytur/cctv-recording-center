package recorder

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type RecordingSession struct {
	CameraID   string
	CameraName string
	RTSPURL    string
	StartTime  time.Time
	cmd        *exec.Cmd
	cancel     context.CancelFunc
}

type Manager struct {
	mu        sync.Mutex
	sessions  map[string]*RecordingSession
	outputDir string
}

var defaultManager *Manager

func init() {
	defaultManager = &Manager{
		sessions:  make(map[string]*RecordingSession),
		outputDir: "data/recordings",
	}
}

// StartRecording starts recording from an RTSP stream
func StartRecording(cameraID, cameraName, rtspURL, username, password string) error {
	return defaultManager.StartRecording(cameraID, cameraName, rtspURL, username, password)
}

// StopRecording stops an active recording session
func StopRecording(cameraID string) error {
	return defaultManager.StopRecording(cameraID)
}

// IsRecording checks if a camera is currently recording
func IsRecording(cameraID string) bool {
	return defaultManager.IsRecording(cameraID)
}

// GetActiveRecordings returns list of active recording sessions
func GetActiveRecordings() []RecordingSession {
	return defaultManager.GetActiveRecordings()
}

func (m *Manager) StartRecording(cameraID, cameraName, rtspURL, username, password string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if already recording
	if session, exists := m.sessions[cameraID]; exists {
		if session.cmd != nil && session.cmd.Process != nil {
			return fmt.Errorf("camera %s is already recording", cameraID)
		}
	}

	// Create RTSP URL with credentials if provided
	authRTSPURL := rtspURL
	if username != "" && password != "" {
		// Parse and inject credentials into RTSP URL
		// Format: rtsp://username:password@host/path
		if strings.HasPrefix(rtspURL, "rtsp://") {
			authRTSPURL = "rtsp://" + username + ":" + password + "@" + strings.TrimPrefix(rtspURL, "rtsp://")
		} else if strings.HasPrefix(rtspURL, "rtsps://") {
			authRTSPURL = "rtsps://" + username + ":" + password + "@" + strings.TrimPrefix(rtspURL, "rtsps://")
		}
	}

	// Create output directory structure: data/recordings/{cameraID}/{date}/
	now := time.Now()
	dateDir := now.Format("2006-01-02")
	outputPath := filepath.Join(m.outputDir, cameraID, dateDir)
	if err := os.MkdirAll(outputPath, 0o755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	// Build ffmpeg command for recording
	// -rtsp_transport tcp: Use TCP for stable connection
	// -fflags +genpts: Generate missing PTS (presentation timestamps)
	// -i: Input RTSP URL
	// -map 0: Map all streams from input
	// -c:v copy: Copy video stream without re-encoding (faster, preserves quality)
	// -c:a aac: Transcode audio to AAC (MP4 compatible, handles pcm_mulaw from cameras)
	// -avoid_negative_ts make_zero: Handle negative timestamps
	// -f segment: Split into segments
	// -segment_time: Duration of each segment in seconds (600 = 10 minutes)
	// -segment_format mp4: Output format
	// -strftime 1: Enable strftime in filename
	// -reset_timestamps 1: Reset timestamps for each segment
	// -segment_format_options: MP4 fragmentation for playable files
	args := []string{
		"-rtsp_transport", "tcp",
		"-fflags", "+genpts",
		"-i", authRTSPURL,
		"-map", "0",
		"-c:v", "copy",
		"-c:a", "aac",
		"-avoid_negative_ts", "make_zero",
		"-f", "segment",
		"-segment_time", "600", // 10-minute segments
		"-segment_format", "mp4",
		"-strftime", "1",
		"-reset_timestamps", "1",
		"-segment_format_options", "movflags=frag_keyframe+empty_moov+default_base_moof",
		filepath.Join(outputPath, fmt.Sprintf("rec_%%Y%%m%%d_%%H%%M%%S.mp4")),
	}

	// Log the full ffmpeg command for debugging (hide password)
	logRTSPURL := rtspURL
	if username != "" {
		logRTSPURL = "rtsp://" + username + ":****@" + strings.TrimPrefix(rtspURL, "rtsp://")
	}
	log.Printf("[recorder] Starting ffmpeg for camera %s with RTSP: %s", cameraID, logRTSPURL)

	ctx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(ctx, "ffmpeg", args...)

	// Log output to file for debugging
	logFile, err := os.OpenFile(
		filepath.Join(outputPath, "recording.log"),
		os.O_CREATE|os.O_WRONLY|os.O_APPEND,
		0o644,
	)
	if err != nil {
		log.Printf("[recorder] Warning: failed to create log file for camera %s: %v", cameraID, err)
	}
	if logFile != nil {
		// Write command header to log
		fmt.Fprintf(logFile, "\n\n=== Recording session started at %s ===\n", now.Format(time.RFC3339))
		fmt.Fprintf(logFile, "Camera: %s (%s)\n", cameraID, cameraName)
		fmt.Fprintf(logFile, "RTSP URL: %s\n", logRTSPURL)
		fmt.Fprintf(logFile, "Command: ffmpeg %s\n", strings.Join(args, " "))
		fmt.Fprintf(logFile, "===========================================\n\n")
		cmd.Stdout = logFile
		cmd.Stderr = logFile
	}

	// Start the recording process
	if err := cmd.Start(); err != nil {
		cancel()
		if logFile != nil {
			fmt.Fprintf(logFile, "\nERROR: Failed to start ffmpeg: %v\n", err)
			logFile.Close()
		}
		log.Printf("[recorder] Failed to start ffmpeg for camera %s: %v", cameraID, err)
		return fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	// Store session
	session := &RecordingSession{
		CameraID:   cameraID,
		CameraName: cameraName,
		RTSPURL:    rtspURL,
		StartTime:  now,
		cmd:        cmd,
		cancel:     cancel,
	}
	m.sessions[cameraID] = session

	// Monitor process in background
	go func() {
		err := cmd.Wait()
		if logFile != nil {
			if err != nil {
				fmt.Fprintf(logFile, "\n=== Recording ended with error at %s ===\n", time.Now().Format(time.RFC3339))
				fmt.Fprintf(logFile, "Error: %v\n", err)
				if exitErr, ok := err.(*exec.ExitError); ok {
					fmt.Fprintf(logFile, "Exit code: %d\n", exitErr.ExitCode())
				}
			} else {
				fmt.Fprintf(logFile, "\n=== Recording ended normally at %s ===\n", time.Now().Format(time.RFC3339))
			}
			logFile.Close()
		}

		m.mu.Lock()
		delete(m.sessions, cameraID)
		m.mu.Unlock()

		if err != nil {
			if exitErr, ok := err.(*exec.ExitError); ok {
				log.Printf("[recorder] Recording for camera %s ended with error (exit code %d): %v", cameraID, exitErr.ExitCode(), err)
			} else {
				log.Printf("[recorder] Recording for camera %s ended with error: %v", cameraID, err)
			}
		} else {
			log.Printf("[recorder] Recording for camera %s ended normally", cameraID)
		}
		cancel()
	}()

	log.Printf("Started recording for camera %s (%s) to %s", cameraID, cameraName, outputPath)
	return nil
}

func (m *Manager) StopRecording(cameraID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	session, exists := m.sessions[cameraID]
	if !exists {
		return fmt.Errorf("no active recording for camera %s", cameraID)
	}

	if session.cmd != nil && session.cmd.Process != nil {
		// Send SIGTERM for graceful shutdown
		if err := session.cmd.Process.Signal(os.Interrupt); err != nil {
			// If interrupt fails, force kill
			session.cmd.Process.Kill()
		}
	}

	if session.cancel != nil {
		session.cancel()
	}

	delete(m.sessions, cameraID)
	log.Printf("Stopped recording for camera %s", cameraID)
	return nil
}

func (m *Manager) IsRecording(cameraID string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()

	session, exists := m.sessions[cameraID]
	if !exists {
		return false
	}

	if session.cmd == nil || session.cmd.Process == nil {
		delete(m.sessions, cameraID)
		return false
	}

	return true
}

func (m *Manager) GetActiveRecordings() []RecordingSession {
	m.mu.Lock()
	defer m.mu.Unlock()

	recordings := make([]RecordingSession, 0, len(m.sessions))
	for _, session := range m.sessions {
		// Don't include cmd and cancel in the copy
		recordings = append(recordings, RecordingSession{
			CameraID:   session.CameraID,
			CameraName: session.CameraName,
			RTSPURL:    session.RTSPURL,
			StartTime:  session.StartTime,
		})
	}

	return recordings
}

// StopAll stops all active recordings (useful for graceful shutdown)
func StopAll() {
	defaultManager.StopAll()
}

func (m *Manager) StopAll() {
	m.mu.Lock()
	cameraIDs := make([]string, 0, len(m.sessions))
	for id := range m.sessions {
		cameraIDs = append(cameraIDs, id)
	}
	m.mu.Unlock()

	for _, id := range cameraIDs {
		if err := m.StopRecording(id); err != nil {
			log.Printf("Error stopping recording for %s: %v", id, err)
		}
	}
}
