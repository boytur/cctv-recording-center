package domain

// Camera represents the domain model for a camera.
type Camera struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Location string `json:"location"`
	RTSPURL  string `json:"rtsp_url"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
	Status   string `json:"status"`
}
