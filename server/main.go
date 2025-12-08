package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/boytur/cctv-recording-center/server/internal/db"
	"github.com/boytur/cctv-recording-center/server/models"
)

func main() {
	// Initialize DB (creates data/server.db by default)
	if _, err := db.Init(""); err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	http.HandleFunc("/api/cameras", camerasHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("server: listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func camerasHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var cams []models.Camera
	if err := db.DB.Find(&cams).Error; err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	_ = json.NewEncoder(w).Encode(cams)
}
