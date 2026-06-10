package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type CoachesHandler struct {
	DB *gorm.DB
}

type AvailabilitySlotRequest struct {
	StartTime time.Time
	EndTime   time.Time
	Frequency models.Frequency
}

type CoachRequest struct {
	Name         string
	Email        string
	Phone        string
	Bio          *string
	Specialties  pq.StringArray
	SessionPrice float64
	AvatarURL    *string
	IsActive     bool
}

func NewCoachesHandler(db *gorm.DB) *CoachesHandler {
	return &CoachesHandler{
		DB: db,
	}
}

func (h *CoachesHandler) GetCoaches(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		limit = 10
	}

	offset := (page - 1) * limit

	query := h.DB.WithContext(c.Request.Context()).Model(&models.Coach{})

	specialty := c.Query("specialty")
	if specialty != "" {
		query = query.Where("specialties && ARRAY[?]", specialty)
	}

	var coaches []models.Coach
	if err := query.Limit(limit).Offset(offset).Order("created_at desc").Find(&coaches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch coaches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  coaches,
		"page":  page,
		"limit": limit,
		"count": len(coaches),
	})
}

func (h *CoachesHandler) GetCoachById(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first before querying for coaches"})
		return
	}

	if userId == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is nil"})
		return
	}

	_, ok := userId.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is not a string"})
		return
	}

	coachId := c.Param("id")
	if coachId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coach ID path parameter is required"})
		return
	}

	var coach models.Coach

	err := h.DB.WithContext(c.Request.Context()).Where("id = ?", coachId).First(&coach).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Coach not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch coach", "err": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": coach,
	})
}

func (h *CoachesHandler) CreateCoach(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first before creating a coach profile"})
		return
	}

	userIdStr, ok := userId.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is not a string"})
		return
	}

	var req CoachRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingCoach models.Coach
	if err := h.DB.WithContext(c.Request.Context()).Where("id = ?", userIdStr).First(&existingCoach).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "A coach profile already exists for this user"})
		return
	}

	coach := models.Coach{
		ID:           userIdStr,
		Name:         req.Name,
		Specialties:  pq.StringArray(req.Specialties),
		Bio:          req.Bio,
		AvatarURL:    req.AvatarURL,
		SessionPrice: req.SessionPrice,
		IsActive:     true,
		Email:        req.Email,
		Phone:        req.Phone,
	}

	if err := h.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&coach).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.User{}).Where("id = ?", userIdStr).Update("role", "coach").Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create coach profile", "err": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Coach profile created successfully",
		"data":    coach,
	})
}

func (h *CoachesHandler) CreateAvailabilitySlots(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first before creating availability slots"})
		return
	}

	userIdStr, ok := userId.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is not a string"})
		return
	}

	var req AvailabilitySlotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.StartTime.After(req.EndTime) || req.StartTime.Equal(req.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Start time must be strictly before end time"})
		return
	}

	if req.StartTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot create availability slots in the past"})
		return
	}

	var existingSlot models.AvailabilitySlot
	err := h.DB.WithContext(c.Request.Context()).
		Where("coach_id = ? AND start_time < ? AND end_time > ?", userIdStr, req.EndTime, req.StartTime).
		First(&existingSlot).Error

	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Time slot overlaps with an existing availability slot"})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error while validating time slot"})
		return
	}

	slot := models.AvailabilitySlot{
		CoachID:   userIdStr,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		IsBooked:  false,
		Frequency: req.Frequency,
	}

	if err := h.DB.WithContext(c.Request.Context()).Create(&slot).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create availability slot"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Availability slot created successfully",
		"data":    slot,
	})
}

func (h *CoachesHandler) GetAvailabilitySlots(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first before getting availability slots"})
		return
	}

	userIdStr, ok := userId.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is not a string"})
		return
	}

	var slots []models.AvailabilitySlot
	if err := h.DB.WithContext(c.Request.Context()).Where("coach_id = ?", userIdStr).Find(&slots).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get availability slots"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Availability slots retrieved successfully",
		"data":    slots,
	})
}
func (h *CoachesHandler) GetAvailabilitySlotsForCoach(c *gin.Context) {
	_, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first before getting availability slots"})
		return
	}

	coachId := c.Param("coach_id")

	if coachId == "" {
		coachId = c.Query("coach_id")
	}

	if coachId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coach ID is required"})
		return
	}

	var slots []models.AvailabilitySlot

	if err := h.DB.WithContext(c.Request.Context()).
		Where("coach_id = ?", coachId).
		Order("start_time asc").
		Find(&slots).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get availability slots"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Availability slots retrieved successfully",
		"data":    slots,
	})
}
