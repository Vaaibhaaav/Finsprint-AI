package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type RatingHandler struct {
	db *gorm.DB
}

type RatingRequest struct {
	CoachID string `json:"coach_id" binding:"required"`
	Rating  int8   `json:"rating" binding:"required,min=1,max=5"`
	Review  string `json:"review"`
}

func NewRatingHandler(db *gorm.DB) *RatingHandler {
	return &RatingHandler{
		db: db,
	}
}

func (h *RatingHandler) CreateNewRating(c *gin.Context) {
	userIdCtx, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first before submitting a rating"})
		return
	}

	userId, ok := userIdCtx.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID format is invalid"})
		return
	}

	var request RatingRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingRating models.Rating

	err := h.db.WithContext(c.Request.Context()).
		Where("coach_id = ? AND user_id = ?", request.CoachID, userId).
		First(&existingRating).Error

	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already rated this coach"})
		return
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking history: " + err.Error()})
		return
	}

	newRating := models.Rating{
		CoachID: request.CoachID,
		UserID:  userId, 
		Rating:  request.Rating,
		Review:  request.Review,
	}

	txErr := h.db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&newRating).Error; err != nil {
			return err
		}

		var stats struct {
			AverageRating float64
		}
		err := tx.Model(&models.Rating{}).
			Select("COALESCE(AVG(rating), 0) as average_rating").
			Where("coach_id = ?", request.CoachID).
			Scan(&stats).Error
		if err != nil {
			return err
		}

		result := tx.Model(&models.Coach{}).
			Where("id = ?", request.CoachID).
			Update("average_rating", stats.AverageRating)

		if result.Error != nil {
			return result.Error
		}

		if result.RowsAffected == 0 {
			return errors.New("coach not found")
		}

		return nil
	})

	if txErr != nil {
		if txErr.Error() == "coach not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "The specified coach does not exist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete rating process: " + txErr.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Rating submitted and coach score calculated successfully",
		"data":    newRating,
	})
}


func (h *RatingHandler) FetchRatingsForCoach(c *gin.Context) {
	_, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first before accessing ratings"})
		return
	}

	coachID := c.Param("id")
	if coachID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coach ID is required"})
		return
	}


	var pagination struct {
		Page  int `form:"page,default=1"`
		Limit int `form:"limit,default=10"`
	}
	if err := c.ShouldBindQuery(&pagination); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pagination parameters"})
		return
	}
	
	if pagination.Page < 1 {
		pagination.Page = 1
	}
	if pagination.Limit < 1 || pagination.Limit > 100 {
		pagination.Limit = 10
	}
	offset := (pagination.Page - 1) * pagination.Limit

	var ratings []models.Rating
	var totalCount int64

	err := h.db.WithContext(c.Request.Context()).
		Model(&models.Rating{}).
		Where("coach_id = ?", coachID).
		Count(&totalCount).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count ratings: " + err.Error()})
		return
	}

	
	err = h.db.WithContext(c.Request.Context()).
		Where("coach_id = ?", coachID).
		Order("created_at DESC"). 
		Limit(pagination.Limit).
		Offset(offset).
		Find(&ratings).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ratings: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": ratings,
		"meta": gin.H{
			"total_records": totalCount,
			"current_page":  pagination.Page,
			"limit":         pagination.Limit,
		},
	})
}