package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vaaaibhav/finsprint/internal"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type DigestHandler struct {
	DB             *gorm.DB
	DigestPipeline *internal.DigestPipeline
}

func NewDigestHandler(db *gorm.DB, pipeline *internal.DigestPipeline) *DigestHandler {
	return &DigestHandler{
		DB:             db,
		DigestPipeline: pipeline,
	}
}

func (h *DigestHandler) GenerateOnDemand(c *gin.Context) {
	clerkID, _ := c.Get("Id")
	userID := clerkID.(string)

	var lastDigest models.Digests
	err := h.DB.WithContext(c.Request.Context()).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&lastDigest).Error

	if err == nil {
		if lastDigest.Status == "processing" {
			c.JSON(http.StatusConflict, gin.H{"status": "processing", "message": "An engine run is already compiling."})
			return
		}
		if time.Since(lastDigest.CreatedAt) < (7 * 24 * time.Hour) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Your weekly report is already up to date."})
			return
		}
	}

	trackingID := uuid.New()
	endTime := time.Now()
	startTime := endTime.AddDate(0, 0, -7)

	placeholder := models.Digests{
		ID:         trackingID,
		UserID:     &userID,
		WeekStart:  startTime,
		WeekEnd:    endTime,
		Status:     "processing",
		Summary:    "Compiling structural analysis...",
		GoalStatus: "[]",
		RawJSON:    "{}",
	}

	if err := h.DB.WithContext(c.Request.Context()).Create(&placeholder).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate tracking allocation"})
		return
	}

	var currentUser models.User
	if err := h.DB.WithContext(c.Request.Context()).Select("id", "email").Where("id = ?", userID).First(&currentUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user context profile"})
		return
	}
	bgCtx := context.Background()
	go h.DigestPipeline.RunUserDigestPipeline(bgCtx, currentUser, trackingID, startTime, endTime)

	c.JSON(http.StatusAccepted, gin.H{
		"status":    "processing",
		"digest_id": trackingID,
		"message":   "Gemini engine optimization sequence initiated.",
	})
}

func (h *DigestHandler) GetDigests(c *gin.Context) {
	clerkID, _ := c.Get("Id")
	userID := clerkID.(string)

	var digests []models.Digests
	err := h.DB.WithContext(c.Request.Context()).Where("user_id = ?", userID).Find(&digests).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch digests"})
		return
	}
	c.JSON(http.StatusOK, digests)
}

func (h *DigestHandler) GetLastDigestByUserID(c *gin.Context) {
	clerkID, _ := c.Get("Id")
	if clerkID == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is nil"})
		return
	}
	userIdParam := c.Param("id")

	var digest models.Digests
	err := h.DB.WithContext(c.Request.Context()).Where("user_id = ?", userIdParam).First(&digest).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch digest"})
		return
	}
	c.JSON(http.StatusOK, digest)
}
