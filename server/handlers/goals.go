package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type GoalHandler struct {
	DB *gorm.DB
}

func NewGoalHandler(db *gorm.DB) *GoalHandler {
	return &GoalHandler{
		DB: db,
	}
}

type GoalRequest struct {
	Name         string     `json:"name" binding:"required"`
	Type         string     `json:"type" binding:"required"`
	TargetAmount float64    `json:"target_amount" binding:"required"`
	SavedAmount  float64    `json:"saved_amount"`
	Description  *string    `json:"description"`
	WeeklyTarget *float64   `json:"weekly_target"`
	Deadline     *time.Time `json:"deadline"`
}

func (g *GoalHandler) CreateNewGoal(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists || userId == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication state missing"})
		return
	}

	userIdStr, ok := userId.(string)
	if !ok || userIdStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Error while converting user ID to string"})
		return
	}

	var goalRequest GoalRequest
	if err := c.ShouldBindJSON(&goalRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	goal := models.Goals{
		UserID:       &userIdStr,
		Name:         goalRequest.Name,
		Type:         goalRequest.Type,
		TargetAmount: goalRequest.TargetAmount,
		SavedAmount:  goalRequest.SavedAmount,
		Description:  goalRequest.Description,
		WeeklyTarget: goalRequest.WeeklyTarget, 
		Deadline:     goalRequest.Deadline,
		IsActive:     true,
	}

	if err := g.DB.WithContext(c.Request.Context()).Create(&goal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save goal error"})
		return
	}

	c.JSON(http.StatusCreated, goal)
}

func (g *GoalHandler) GetGoalByUserId(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists || userId == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication state missing"})
		return
	}

	userIDStr, ok := userId.(string)
	if !ok || userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Error while converting user ID to string"})
		return
	}

	var goals []models.Goals
	if err := g.DB.WithContext(c.Request.Context()).Where("user_id = ?", userIDStr).Find(&goals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get goals"})
		return
	}

	c.JSON(http.StatusOK, goals)
}

func (g *GoalHandler) GetGoalById(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists || userId == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication state missing"})
		return
	}

	userIDStr, ok := userId.(string)
	if !ok || userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Error while converting user ID to string"})
		return
	}

	goalId := c.Param("id")

	var goal models.Goals
	if err := g.DB.WithContext(c.Request.Context()).Where("id = ? AND user_id = ?", goalId, userIDStr).First(&goal).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}

	c.JSON(http.StatusOK, goal)
}

func (g *GoalHandler) UpdateGoal(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists || userId == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication state missing"})
		return
	}

	userIDStr, ok := userId.(string)
	if !ok || userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Error while converting user ID to string"})
		return
	}

	goalId := c.Param("id")

	var goal models.Goals
	if err := g.DB.WithContext(c.Request.Context()).Where("id = ? AND user_id = ?", goalId, userIDStr).First(&goal).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}

	var input struct {
		Name         *string    `json:"name"`
		Type         *string    `json:"type"`
		Description  *string    `json:"description"`
		TargetAmount *float64   `json:"target_amount"`
		SavedAmount  *float64   `json:"saved_amount"`
		WeeklyTarget *float64   `json:"weekly_target"`
		Deadline     *time.Time `json:"deadline"`
		IsActive     *bool      `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != nil {
		goal.Name = *input.Name
	}
	if input.Type != nil {
		goal.Type = *input.Type
	}
	if input.Description != nil {
		goal.Description = input.Description
	}
	if input.TargetAmount != nil {
		goal.TargetAmount = *input.TargetAmount
	}
	if input.SavedAmount != nil {
		goal.SavedAmount = *input.SavedAmount
	}
	if input.WeeklyTarget != nil {
		goal.WeeklyTarget = input.WeeklyTarget
	}
	if input.Deadline != nil {
		goal.Deadline = input.Deadline
	}
	if input.IsActive != nil {
		goal.IsActive = *input.IsActive
	}

	if err := g.DB.WithContext(c.Request.Context()).Save(&goal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update goal"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Goal updated successfully",
		"data":    goal,
	})
}
