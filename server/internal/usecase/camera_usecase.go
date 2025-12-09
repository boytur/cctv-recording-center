package usecase

import (
	"github.com/boytur/cctv-recording-center/server/internal/domain"
	"github.com/google/uuid"
)

// CameraRepo is the minimal interface the usecase depends on.
type CameraRepo interface {
	List() ([]*domain.Camera, error)
	GetByID(id string) (*domain.Camera, error)
	Create(c *domain.Camera) error
	Update(c *domain.Camera) error
	Delete(id string) error
}

// CameraDTO is a transport-friendly camera representation for handlers.
type CameraDTO struct {
	ID       string
	Name     string
	Location string
	RTSPURL  string
	Username string
	Password string
	Status   string
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

// CreateCamera validates and creates a camera, generating an ID if needed.
func (u *CameraUsecase) CreateCamera(dto *CameraDTO) (*domain.Camera, error) {
	id := dto.ID
	if id == "" {
		id = uuid.New().String()
	}
	cam := &domain.Camera{
		ID:       id,
		Name:     dto.Name,
		Location: dto.Location,
		RTSPURL:  dto.RTSPURL,
		Username: dto.Username,
		Password: dto.Password,
		Status:   dto.Status,
	}
	if cam.Status == "" {
		cam.Status = "unknown"
	}
	if err := u.repo.Create(cam); err != nil {
		return nil, err
	}
	return cam, nil
}

// UpdateCamera updates an existing camera.
func (u *CameraUsecase) UpdateCamera(dto *CameraDTO) (*domain.Camera, error) {
	existing, err := u.repo.GetByID(dto.ID)
	if err != nil {
		return nil, err
	}
	if dto.Name != "" {
		existing.Name = dto.Name
	}
	if dto.Location != "" {
		existing.Location = dto.Location
	}
	if dto.RTSPURL != "" {
		existing.RTSPURL = dto.RTSPURL
	}
	if dto.Username != "" {
		existing.Username = dto.Username
	}
	if dto.Password != "" {
		existing.Password = dto.Password
	}
	if dto.Status != "" {
		existing.Status = dto.Status
	}
	if err := u.repo.Update(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

// DeleteCamera removes a camera.
func (u *CameraUsecase) DeleteCamera(id string) error {
	return u.repo.Delete(id)
}
