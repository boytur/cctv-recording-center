package monitor

import (
	"log"
	"net"
	"net/url"
	"strings"
	"time"

	"github.com/boytur/cctv-recording-center/server/internal/repository"
)

// StartMonitor launches a background checker that polls camera RTSP endpoints
// every `interval` and updates their Status to "online" or "offline".
func StartMonitor(repo repository.CameraRepository, interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for range ticker.C {
			cams, err := repo.List()
			if err != nil {
				log.Printf("monitor: failed to list cameras: %v", err)
				continue
			}
			for _, c := range cams {
				online := checkReachable(c.RTSPURL, 1*time.Second)
				newStatus := "offline"
				if online {
					newStatus = "online"
				}
				if c.Status != newStatus {
					c.Status = newStatus
					if err := repo.Update(c); err != nil {
						log.Printf("monitor: failed to update camera %s status: %v", c.ID, err)
					}
				}
			}
		}
	}()
}

// checkReachable tries to TCP connect to the host:port extracted from the RTSP URL.
// If no port is provided in the URL, default RTSP port 554 is used.
func checkReachable(rtsp string, timeout time.Duration) bool {
	if rtsp == "" {
		return false
	}
	// Parse URL to obtain host (may include port)
	u, err := url.Parse(rtsp)
	if err != nil {
		// try to fallback: if string looks like ip:port
		host := rtsp
		return tryDial(host, timeout)
	}
	host := u.Host
	if host == "" {
		// maybe provided without scheme, try raw
		host = rtsp
	}
	// If host contains path (no explicit host parse), attempt to trim
	if strings.Contains(host, "/") {
		parts := strings.SplitN(host, "/", 2)
		host = parts[0]
	}
	// if no port, append default 554
	if !strings.Contains(host, ":") {
		host = host + ":554"
	}
	return tryDial(host, timeout)
}

func tryDial(host string, timeout time.Duration) bool {
	conn, err := net.DialTimeout("tcp", host, timeout)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}
