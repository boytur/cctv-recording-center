package httpadapter

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRouter configures the Gin router with all routes and middleware
func SetupRouter(h *Handler) *gin.Engine {
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Serve static files from data directory
	r.StaticFS("/data", gin.Dir("data", true))
	r.StaticFS("/stream_hls", gin.Dir("data/streams", true))

	// Health check
	r.GET("/health", h.Health)

	// API routes
	api := r.Group("/api")
	{
		// Camera routes
		api.GET("/cameras", h.ListCameras)
		api.POST("/cameras", h.CreateCamera)
		api.PUT("/cameras/:id", h.UpdateCamera)
		api.DELETE("/cameras/:id", h.DeleteCamera)

		// Recording routes
		api.GET("/recordings", h.Recordings)
		api.GET("/recordings/active", h.ActiveRecordings)
		api.GET("/timeline", h.Timeline)
		api.POST("/cameras/:id/start-recording", h.StartRecording)
		api.POST("/cameras/:id/stop-recording", h.StopRecording)

		// Streaming routes
		api.GET("/stream/:id", h.Stream)
		api.GET("/stream/:id/hls", h.StreamHLS)
	}

	// Fallback for SPA routing
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
	})

	return r
}
