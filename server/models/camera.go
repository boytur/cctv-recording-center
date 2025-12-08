package models

// Camera is a simple model for cameras in the system.
type Camera struct {
	ID     string `gorm:"primaryKey" json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}
