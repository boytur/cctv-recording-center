package domain

// Camera represents the domain model for a camera.
type Camera struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}
