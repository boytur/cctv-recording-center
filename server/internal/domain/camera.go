package domain

// Camera represents the domain model for a camera.
type Camera struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Location string `json:"location"`
	RTSPURL  string `json:"rtsp_url"`
	Status   string `json:"status"`
}
