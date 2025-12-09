package httpadapter

import (
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/boytur/cctv-recording-center/server/internal/recorder"
	"github.com/boytur/cctv-recording-center/server/internal/stream"
	"github.com/boytur/cctv-recording-center/server/internal/usecase"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	uc *usecase.CameraUsecase
}

func NewHandler(uc *usecase.CameraUsecase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) Health(c *gin.Context) {
	c.String(http.StatusOK, "ok")
}

func (h *Handler) ListCameras(c *gin.Context) {
	cams, err := h.uc.ListCameras()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, cams)
}

// Recordings returns a list of recording files for a camera on a given date.
func (h *Handler) Recordings(c *gin.Context) {
	cameraId := c.Query("cameraId")
	date := c.Query("date")
	// basic validation
	if cameraId == "" || date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing cameraId or date"})
		return
	}

	// Parse date
	targetDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	// Build path to recordings directory
	recordingsPath := filepath.Join("data", "recordings", cameraId, targetDate.Format("2006-01-02"))

	// Check if directory exists
	if _, err := os.Stat(recordingsPath); os.IsNotExist(err) {
		// No recordings for this date
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}

	// Read all MP4 files from the directory
	recordings := []map[string]interface{}{}
	err = filepath.WalkDir(recordingsPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(strings.ToLower(d.Name()), ".mp4") {
			return nil
		}

		info, err := d.Info()
		if err != nil {
			return nil
		}

		fileSize := info.Size()

		// Skip files that are 0 bytes (corrupted or still being written)
		if fileSize == 0 {
			return nil
		}

		// Extract timestamp from filename if possible
		// Format: rec_YYYYMMDD_HHMMSS.mp4
		var startTime time.Time
		name := d.Name()
		if strings.HasPrefix(name, "rec_") && len(name) >= 19 {
			timeStr := name[4:19] // YYYYMMDD_HHMMSS
			if t, err := time.Parse("20060102_150405", timeStr); err == nil {
				startTime = t
			}
		}
		if startTime.IsZero() {
			startTime = info.ModTime()
		}

		// Calculate relative path for URL
		relPath := strings.TrimPrefix(path, "data/")
		relPath = strings.ReplaceAll(relPath, "\\", "/")

		fileSizeMB := float64(fileSize) / (1024 * 1024)

		recordings = append(recordings, map[string]interface{}{
			"id":            filepath.Base(path),
			"cameraId":      cameraId,
			"cameraName":    cameraId,
			"startTime":     startTime.Format(time.RFC3339),
			"duration":      600, // Approximate, could parse from file metadata
			"fileSize":      fmt.Sprintf("%.2f MB", fileSizeMB),
			"fileSizeBytes": fileSize,
			"url":           "/" + relPath,
			"thumbnailUrl":  "/placeholder.svg",
		})

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read recordings"})
		return
	}

	c.JSON(http.StatusOK, recordings)
}

// Timeline returns per-hour segments indicating if a recording exists.
func (h *Handler) Timeline(c *gin.Context) {
	cameraId := c.Query("cameraId")
	date := c.Query("date")
	if cameraId == "" || date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing cameraId or date"})
		return
	}
	segments := []map[string]interface{}{}
	// simple pattern: alternate recording availability
	for hour := 0; hour < 24; hour++ {
		hasRecording := (hour%2 == 0)
		segments = append(segments, map[string]interface{}{
			"startTime":    fmt.Sprintf("%02d:00", hour),
			"endTime":      fmt.Sprintf("%02d:59", hour),
			"duration":     60,
			"hasRecording": hasRecording,
		})
	}
	c.JSON(http.StatusOK, segments)
}

// Stream returns metadata for a camera stream (RTSP URL). The frontend uses
// `/api/stream/:id` as `src` for the player; here we return a JSON object with
// the RTSP url. In a production setup this could proxy or transcode to HLS.
func (h *Handler) Stream(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing id"})
		return
	}
	cams, err := h.uc.ListCameras()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	var cam *usecase.CameraDTO
	var found bool
	for _, c := range cams {
		if c.ID == id {
			// convert domain.Camera (returned by usecase.ListCameras) to DTO-like map
			cam = &usecase.CameraDTO{ID: c.ID, Name: c.Name, Location: c.Location, RTSPURL: c.RTSPURL, Status: c.Status}
			found = true
			break
		}
	}
	if !found || cam == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	// Return JSON with RTSP URL so frontend can use it or handle accordingly
	c.JSON(http.StatusOK, gin.H{"rtsp_url": cam.RTSPURL})
}

// StreamHLS ensures an HLS stream exists for the camera and returns the public URL.
func (h *Handler) StreamHLS(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing id"})
		return
	}
	cams, err := h.uc.ListCameras()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	var rtsp string
	for _, c := range cams {
		if c.ID == id {
			rtsp = c.RTSPURL
			break
		}
	}
	if rtsp == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	url, err := stream.StartHLS(id, rtsp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to start hls: %v", err)})
		return
	}

	// wait a short time for ffmpeg to create the playlist file
	playlistPath := filepath.Join("data", "streams", id, "index.m3u8")
	ready := false
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		if _, err := os.Stat(playlistPath); err == nil {
			ready = true
			break
		}
		time.Sleep(250 * time.Millisecond)
	}

	if ready {
		c.JSON(http.StatusOK, gin.H{"url": url, "ready": true})
		return
	}
	// not ready yet — return accepted with URL so client can poll
	c.JSON(http.StatusAccepted, gin.H{"url": url, "ready": false})
}

// CreateCamera handles POST /api/cameras
func (h *Handler) CreateCamera(c *gin.Context) {
	var payload struct {
		ID       string `json:"id,omitempty"`
		Name     string `json:"name"`
		Location string `json:"location"`
		RTSPURL  string `json:"rtsp_url"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	cam := &usecase.CameraDTO{
		ID:       payload.ID,
		Name:     payload.Name,
		Location: payload.Location,
		RTSPURL:  payload.RTSPURL,
	}
	created, err := h.uc.CreateCamera(cam)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create"})
		return
	}
	c.JSON(http.StatusCreated, created)
}

// UpdateCamera handles PUT /api/cameras/{id}
func (h *Handler) UpdateCamera(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing id"})
		return
	}
	var payload struct {
		Name     string `json:"name"`
		Location string `json:"location"`
		RTSPURL  string `json:"rtsp_url"`
		Status   string `json:"status"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	cam := &usecase.CameraDTO{ID: id, Name: payload.Name, Location: payload.Location, RTSPURL: payload.RTSPURL, Status: payload.Status}
	updated, err := h.uc.UpdateCamera(cam)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update"})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// DeleteCamera handles DELETE /api/cameras/{id}
func (h *Handler) DeleteCamera(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing id"})
		return
	}
	if err := h.uc.DeleteCamera(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete"})
		return
	}
	c.Status(http.StatusNoContent)
}

// StartRecording starts recording for a camera
func (h *Handler) StartRecording(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing camera id"})
		return
	}

	// Get camera details
	cams, err := h.uc.ListCameras()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	var camera *usecase.CameraDTO
	for _, cam := range cams {
		if cam.ID == id {
			camera = &usecase.CameraDTO{
				ID:       cam.ID,
				Name:     cam.Name,
				Location: cam.Location,
				RTSPURL:  cam.RTSPURL,
				Status:   cam.Status,
			}
			break
		}
	}

	if camera == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "camera not found"})
		return
	}

	// Check if camera is online
	if camera.Status != "online" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "camera is offline"})
		return
	}

	// Start recording
	if err := recorder.StartRecording(camera.ID, camera.Name, camera.RTSPURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to start recording: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "recording started",
		"camera_id":   camera.ID,
		"camera_name": camera.Name,
	})
}

// StopRecording stops recording for a camera
func (h *Handler) StopRecording(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing camera id"})
		return
	}

	if err := recorder.StopRecording(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to stop recording: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "recording stopped",
		"camera_id": id,
	})
}

// ActiveRecordings returns list of active recording sessions
func (h *Handler) ActiveRecordings(c *gin.Context) {
	sessions := recorder.GetActiveRecordings()

	recordings := make([]map[string]interface{}, 0, len(sessions))
	for _, session := range sessions {
		recordings = append(recordings, map[string]interface{}{
			"camera_id":   session.CameraID,
			"camera_name": session.CameraName,
			"start_time":  session.StartTime.Format(time.RFC3339),
			"duration":    time.Since(session.StartTime).Seconds(),
		})
	}

	c.JSON(http.StatusOK, recordings)
}
