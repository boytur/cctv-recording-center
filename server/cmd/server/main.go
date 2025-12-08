package main

import (
	"log"
	"net/http"
	"os"

	dbadapter "github.com/boytur/cctv-recording-center/server/internal/adapter/db"
	httpadapter "github.com/boytur/cctv-recording-center/server/internal/adapter/http"
	"github.com/boytur/cctv-recording-center/server/internal/usecase"
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

	http.HandleFunc("/health", h.Health)
	http.HandleFunc("/api/cameras", h.ListCameras)

	port := os.Getenv("PORT")
	if port == "" {
		port = "2068"
	}

	log.Printf("cctv-recording-center server: listening on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
