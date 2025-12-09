package db

import (
	"log"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	_ "modernc.org/sqlite" // Pure Go SQLite driver (no gcc required)

	"github.com/boytur/cctv-recording-center/server/models"
)

var DB *gorm.DB

// Init opens a sqlite database at the provided path (creates directories as needed),
// runs AutoMigrate for known models, and seeds initial data if empty.
func Init(path string) (*gorm.DB, error) {
	if path == "" {
		path = "data/server.db"
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(&models.Camera{}); err != nil {
		return nil, err
	}

	DB = db

	var count int64
	db.Model(&models.Camera{}).Count(&count)
	if count == 0 {
		seed := []models.Camera{
			{ID: "cam1", Name: "Front Gate", Status: "online", RtspURL: "rtsp://bom:1234567890@@192.168.1.110/Streaming/Channels/202"},
			{ID: "cam2", Name: "Parking", Status: "online", RtspURL: "rtsp://bom:1234567890@@192.168.1.110/Streaming/Channels/102"},
			{ID: "cam3", Name: "Lobby", Status: "online", RtspURL: "rtsp://bom:1234567890@@192.168.1.110/Streaming/Channels/302"},
			{ID: "cam4", Name: "Warehouse", Status: "offline", RtspURL: "rtsp://bom:1234567890@@192.168.1.110/Streaming/Channels/402"},
		}
		if err := db.Create(&seed).Error; err != nil {
			log.Printf("failed to seed cameras: %v", err)
		}
	}

	return db, nil
}
