package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type UserHandler struct {
	DB *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{DB: db}
}

func (h *UserHandler) GetUser(c *gin.Context) {
	userId , exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}
	userIDStr := userId.(string)	
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID path parameter is required"})
		return
	}

	var user models.User

	err := h.DB.WithContext(c.Request.Context()).
		Where("id = ?", userIDStr).
		First(&user).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "An unexpected error occurred"})
		return
	}

	c.JSON(http.StatusOK, user)
}	

func (h *UserHandler) CreateUser(c *gin.Context) {

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read request body"})
		return
	}

	var user models.User
	if err := json.Unmarshal(body, &user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = h.DB.WithContext(c.Request.Context()).Create(&user).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusOK, user)
}
