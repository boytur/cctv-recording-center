package httpadapter

import (
	"encoding/json"
	"net/http"

	"github.com/boytur/cctv-recording-center/server/internal/usecase"
)

type Handler struct {
	uc *usecase.CameraUsecase
}

func NewHandler(uc *usecase.CameraUsecase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func (h *Handler) ListCameras(w http.ResponseWriter, r *http.Request) {
	cams, err := h.uc.ListCameras()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(cams)
}
