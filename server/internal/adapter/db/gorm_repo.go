package dbadapter

import (
	"database/sql"
	"os"
	"path/filepath"

	"github.com/boytur/cctv-recording-center/server/internal/domain"
	gsqlite "gorm.io/driver/sqlite"
	"gorm.io/gorm"
	_ "modernc.org/sqlite"
)

// gormCamera is the GORM representation of domain.Camera.
type gormCamera struct {
	ID       string `gorm:"primaryKey" json:"id"`
	Name     string `json:"name"`
	Location string `json:"location"`
	RTSPURL  string `json:"rtsp_url"`
	Username string `json:"username"`
	Password string `json:"password"`
	Status   string `json:"status"`
}

// Ensure mapping between domain and gorm model.
func (g *gormCamera) toDomain() *domain.Camera {
	return &domain.Camera{ID: g.ID, Name: g.Name, Location: g.Location, RTSPURL: g.RTSPURL, Username: g.Username, Password: g.Password, Status: g.Status}
}

func fromDomain(d *domain.Camera) *gormCamera {
	return &gormCamera{ID: d.ID, Name: d.Name, Location: d.Location, RTSPURL: d.RTSPURL, Username: d.Username, Password: d.Password, Status: d.Status}
}

// GormCameraRepo implements repository via GORM.
type GormCameraRepo struct {
	db *gorm.DB
}

// NewGormDB opens the sqlite DB and performs AutoMigrate.
func NewGormDB(path string) (*gorm.DB, error) {
	if path == "" {
		path = "data/server.db"
	}
	// ensure parent directory exists so the sqlite file can be created
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	// open database using modernc.org/sqlite driver (pure-Go) and pass the
	// *sql.DB to GORM using gorm's OpenDB.
	sqlDB, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db, err := gorm.Open(gsqlite.New(gsqlite.Config{Conn: sqlDB}), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&gormCamera{}); err != nil {
		return nil, err
	}
	// No seed data - cameras will be added via UI
	return db, nil
}

// NewGormCameraRepo returns a repository backed by gorm DB.
func NewGormCameraRepo(db *gorm.DB) *GormCameraRepo {
	return &GormCameraRepo{db: db}
}

// List implements listing cameras.
func (r *GormCameraRepo) List() ([]*domain.Camera, error) {
	var gs []gormCamera
	if err := r.db.Find(&gs).Error; err != nil {
		return nil, err
	}
	res := make([]*domain.Camera, 0, len(gs))
	for _, g := range gs {
		res = append(res, g.toDomain())
	}
	return res, nil
}

// GetByID implements repository GetByID.
func (r *GormCameraRepo) GetByID(id string) (*domain.Camera, error) {
	var g gormCamera
	if err := r.db.First(&g, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return g.toDomain(), nil
}

// Create inserts a new camera.
func (r *GormCameraRepo) Create(c *domain.Camera) error {
	return r.db.Create(fromDomain(c)).Error
}

// Update updates an existing camera.
func (r *GormCameraRepo) Update(c *domain.Camera) error {
	return r.db.Model(&gormCamera{}).Where("id = ?", c.ID).Updates(fromDomain(c)).Error
}

// Delete removes a camera by id.
func (r *GormCameraRepo) Delete(id string) error {
	return r.db.Delete(&gormCamera{}, "id = ?", id).Error
}
