package usecase

import "github.com/boytur/cctv-recording-center/server/internal/domain"

// CameraRepo is the minimal interface the usecase depends on.
type CameraRepo interface {
	List() ([]*domain.Camera, error)
}

// CameraUsecase contains business logic for cameras.
type CameraUsecase struct {
	repo CameraRepo
}

// NewCameraUsecase creates a new CameraUsecase.
func NewCameraUsecase(r CameraRepo) *CameraUsecase {
	return &CameraUsecase{repo: r}
}

// ListCameras returns all cameras from the repository.
func (u *CameraUsecase) ListCameras() ([]*domain.Camera, error) {
	return u.repo.List()
}
