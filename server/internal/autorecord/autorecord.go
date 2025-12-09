package autorecord

import (
	"log"
	"time"

	"github.com/boytur/cctv-recording-center/server/internal/recorder"
	"github.com/boytur/cctv-recording-center/server/internal/repository"
)

// Manager handles automatic recording for online cameras
type Manager struct {
	repo     repository.CameraRepository
	interval time.Duration
	stopChan chan struct{}
}

// NewManager creates a new auto-record manager
func NewManager(repo repository.CameraRepository, checkInterval time.Duration) *Manager {
	return &Manager{
		repo:     repo,
		interval: checkInterval,
		stopChan: make(chan struct{}),
	}
}

// Start begins the automatic recording monitor
func (m *Manager) Start() {
	go m.monitor()
}

// Stop stops the automatic recording monitor
func (m *Manager) Stop() {
	close(m.stopChan)
}

func (m *Manager) monitor() {
	ticker := time.NewTicker(m.interval)
	defer ticker.Stop()

	// Run immediately on start
	m.checkAndRecord()

	for {
		select {
		case <-ticker.C:
			m.checkAndRecord()
		case <-m.stopChan:
			return
		}
	}
}

func (m *Manager) checkAndRecord() {
	cameras, err := m.repo.List()
	if err != nil {
		log.Printf("auto-record: failed to list cameras: %v", err)
		return
	}

	for _, cam := range cameras {
		// Only record if camera is online
		if cam.Status != "online" {
			// If camera is offline and was recording, stop it
			if recorder.IsRecording(cam.ID) {
				log.Printf("auto-record: camera %s (%s) went offline, stopping recording", cam.ID, cam.Name)
				if err := recorder.StopRecording(cam.ID); err != nil {
					log.Printf("auto-record: failed to stop recording for %s: %v", cam.ID, err)
				}
			}
			continue
		}

		// Check if already recording
		if recorder.IsRecording(cam.ID) {
			// Check if we need to restart for new day
			sessions := recorder.GetActiveRecordings()
			for _, session := range sessions {
				if session.CameraID == cam.ID {
					// Check if recording started on a different day
					if !isSameDay(session.StartTime, time.Now()) {
						log.Printf("auto-record: new day detected for camera %s (%s), restarting recording", cam.ID, cam.Name)
						// Stop current recording
						if err := recorder.StopRecording(cam.ID); err != nil {
							log.Printf("auto-record: failed to stop recording for %s: %v", cam.ID, err)
							continue
						}
						// Wait a moment before restarting
						time.Sleep(2 * time.Second)
						// Start new recording
						if err := recorder.StartRecording(cam.ID, cam.Name, cam.RTSPURL, cam.Username, cam.Password); err != nil {
							log.Printf("auto-record: failed to restart recording for %s: %v", cam.ID, err)
						} else {
							log.Printf("auto-record: restarted recording for camera %s (%s) for new day", cam.ID, cam.Name)
						}
					}
					break
				}
			}
			continue
		}

		// Camera is online but not recording, start recording
		log.Printf("auto-record: starting automatic recording for camera %s (%s)", cam.ID, cam.Name)
		if err := recorder.StartRecording(cam.ID, cam.Name, cam.RTSPURL, cam.Username, cam.Password); err != nil {
			log.Printf("auto-record: failed to start recording for %s: %v", cam.ID, err)
		} else {
			log.Printf("auto-record: successfully started recording for camera %s (%s)", cam.ID, cam.Name)
		}
	}
}

// isSameDay checks if two times are on the same calendar day
func isSameDay(t1, t2 time.Time) bool {
	y1, m1, d1 := t1.Date()
	y2, m2, d2 := t2.Date()
	return y1 == y2 && m1 == m2 && d1 == d2
}
