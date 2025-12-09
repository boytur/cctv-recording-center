package repository

import "github.com/boytur/cctv-recording-center/server/internal/domain"

// CameraRepository defines persistence operations for cameras.
type CameraRepository interface {
	List() ([]*domain.Camera, error)
	GetByID(id string) (*domain.Camera, error)
	Create(c *domain.Camera) error
	Update(c *domain.Camera) error
	Delete(id string) error
}
