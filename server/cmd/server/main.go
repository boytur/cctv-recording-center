package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	dbadapter "github.com/boytur/cctv-recording-center/server/internal/adapter/db"
	httpadapter "github.com/boytur/cctv-recording-center/server/internal/adapter/http"
	"github.com/boytur/cctv-recording-center/server/internal/autorecord"
	"github.com/boytur/cctv-recording-center/server/internal/monitor"
	"github.com/boytur/cctv-recording-center/server/internal/recorder"
	"github.com/boytur/cctv-recording-center/server/internal/usecase"

	"time"
)

func main() {
	// initialize DB
	dbPath := os.Getenv("DB_PATH")
	db, err := dbadapter.NewGormDB(dbPath)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}

	// create repository and usecase
	repo := dbadapter.NewGormCameraRepo(db)
	uc := usecase.NewCameraUsecase(repo)

	// create handlers
	h := httpadapter.NewHandler(uc)

	// start background monitor to update camera online/offline status
	monitor.StartMonitor(repo, 1*time.Minute)

	// start automatic recording for online cameras
	autoRecorder := autorecord.NewManager(repo, 30*time.Second)
	autoRecorder.Start()
	log.Println("Auto-recording enabled: cameras will record automatically when online")

	// setup router
	r := httpadapter.SetupRouter(h)

	port := os.Getenv("PORT")
	if port == "" {
		port = "2068"
	}

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan
		log.Println("Shutting down gracefully...")
		autoRecorder.Stop()
		recorder.StopAll()
		os.Exit(0)
	}()

	log.Printf("cctv-recording-center server: listening on http://localhost:%s", port)
	log.Fatal(r.Run(":" + port))
}
