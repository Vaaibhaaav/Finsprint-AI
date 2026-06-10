package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type SessionHandler struct {
	DB *gorm.DB
}

func NewSessionHandler(db *gorm.DB) *SessionHandler {
	return &SessionHandler{DB: db}
}

type CreateSessionRequest struct {
	StripePaymentID string `json:"stripe_payment_id" binding:"required"`
}

type HandleSessionRequest struct {
	SessionID string `json:"session_id" binding:"required"`
	Status    string `json:"status" binding:"required"`
}

func (h *SessionHandler) BookSession(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first before booking a session"})
		return
	}

	userIdStr, ok := userId.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is not a string"})
		return
	}

	coachId := c.Query("coach_id")
	slotId := c.Query("slot_id")
	if coachId == "" || slotId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Both coach_id and slot_id query parameters are required"})
		return
	}

	var sessionReq CreateSessionRequest
	if err := c.ShouldBindJSON(&sessionReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedSlotID, err := uuid.Parse(slotId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid slot ID format"})
		return
	}

	var slot models.AvailabilitySlot

	err = h.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			Where("id = ? AND coach_id = ? AND is_booked = ?", parsedSlotID, coachId, false).
			First(&slot).Error; err != nil {
			return errors.New("availability slot is unavailable or does not exist")
		}

		session := models.Session{
			UserID:          &userIdStr,
			CoachID:         &coachId,
			SlotID:          &parsedSlotID,
			Status:          "pending",
			StripePaymentID: &sessionReq.StripePaymentID,
			ScheduledAt:     slot.StartTime,
			ActionItems:     "{}", 
		}

		if err := tx.Create(&session).Error; err != nil {
			return err
		}

		if err := tx.Model(&slot).Update("is_booked", true).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Session booked and requested successfully"})
}

func (h *SessionHandler) HandleSessionRequest(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first"})
		return
	}

	userIdStr, ok := userId.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID conversion error"})
		return
	}

	var sessionReq HandleSessionRequest
	if err := c.ShouldBindJSON(&sessionReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if sessionReq.Status != "accepted" && sessionReq.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be either 'accepted' or 'rejected'"})
		return
	}

	var session models.Session

	err := h.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			Where("id = ?", sessionReq.SessionID).
			First(&session).Error; err != nil {
			return errors.New("session record not found")
		}

		if session.CoachID == nil || *session.CoachID != userIdStr {
			return errors.New("unauthorized: you are not authorized to handle this session profile")
		}

		if session.Status != "pending" {
			return errors.New("session is no longer in a pending state parameters state")
		}

		if err := tx.Model(&session).Update("status", sessionReq.Status).Error; err != nil {
			return err
		}

		if sessionReq.Status == "rejected" && session.SlotID != nil {
			if err := tx.Model(&models.AvailabilitySlot{}).
				Where("id = ?", *session.SlotID).
				Update("is_booked", false).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		if err.Error() == "session record not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "unauthorized: you are not authorized to handle this session profile" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session request successfully handled"})
}

func (h *SessionHandler) GetSessionsAsCoach(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first"})
		return
	}

	userIdStr, ok := userId.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID parsing failed"})
		return
	}

	var sessions []models.Session
	err := h.DB.WithContext(c.Request.Context()).
		Preload("User").
		Preload("Coach"). 
		Where("coach_id = ?", userIdStr).
		Order("scheduled_at asc").
		Find(&sessions).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": sessions})
}

func (h *SessionHandler) GetSessionDigest(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first"})
		return
	}

	userIdStr, ok := userId.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID tracking mismatch"})
		return
	}

	var session models.Session
	if err := h.DB.WithContext(c.Request.Context()).Where("id = ?", c.Param("id")).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	if session.CoachID == nil || session.UserID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session structural relational references are empty"})
		return
	}

	if *session.CoachID != userIdStr {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to view this session configuration resource"})
		return
	}

	var digest models.Digests
	if err := h.DB.WithContext(c.Request.Context()).Where("user_id = ?", *session.UserID).First(&digest).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session digest dataset missing"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": digest})
}

func (h *SessionHandler) GetSessionAsUser(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login first"})
		return
	}

	userIdStr, ok := userId.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID parsing failed"})
		return
	}

	var sessions []models.Session
	err := h.DB.WithContext(c.Request.Context()).
		Preload("User").
		Preload("Coach"). 
		Where("user_id = ?", userIdStr).
		Order("scheduled_at asc").
		Find(&sessions).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": sessions})
}