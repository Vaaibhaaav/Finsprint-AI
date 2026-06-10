package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	internal "github.com/vaaaibhav/finsprint/internal"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type TransactionHandler struct {
	DB   *gorm.DB
	Pool *internal.Pool
}

type CreateTransactionRequest struct {
	Amount                decimal.Decimal              `json:"amount" binding:"required"`
	Type                  models.TransactionType       `json:"type" binding:"required,oneof=expense income"`
	Merchant              *string                      `json:"merchant"`
	Description           *string                      `json:"description"`
	Category              *string                      `json:"category"`
	Motive                string                       `json:"motive" binding:"omitempty"`
	Date                  time.Time                    `json:"date" binding:"required"`
	TransactionIdentifier models.TransactionIdentifier `json:"transaction_identifier" binding:"omitempty"`
}

func NewTransactionHandler(db *gorm.DB, pool *internal.Pool) *TransactionHandler {
	return &TransactionHandler{
		DB:   db,
		Pool: pool,
	}
}

func (h *TransactionHandler) GetTransaction() gin.HandlerFunc {
	return func(c *gin.Context) {
		transactionIdStr := c.Param("transaction_id")
		if transactionIdStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Transaction ID path parameter is required"})
			return
		}

		var transaction models.Transaction

		err := h.DB.WithContext(c.Request.Context()).Where("id = ?", transactionIdStr).First(&transaction).Error
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
			return
		}

		c.JSON(http.StatusOK, transaction)
	}
}

func (h *TransactionHandler) CreateTransaction(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Authentication state missing"})
		return
	}

	if userId == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is nil"})
		return
	}

	var req CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount.IsZero() || req.Amount.IsNegative() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Transaction amount must be greater than zero"})
		return
	}

	if req.Motive == "" {
		req.Motive = "Untagged"
	}

	userIdStr := userId.(string)
	transaction := models.Transaction{
		UserID:      &userIdStr,
		Amount:      req.Amount,
		Type:        req.Type,
		Merchant:    req.Merchant,
		Description: req.Description,
		Category:    req.Category,
		Motive:      req.Motive,
		Date:        req.Date,
	}

	if err := h.DB.WithContext(c.Request.Context()).Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save transaction record"})
		return
	}

	amountInFloat, _ := transaction.Amount.Float64()
	var descText string
	if transaction.Description != nil {
		descText = *transaction.Description
	}

	if h.Pool != nil {
		h.Pool.Submit(internal.TaggingJob{
			TransactionID: transaction.ID.String(),
			Description:   descText,
			Amount:        amountInFloat,
			UserID:        userIdStr,
		})
	}

	c.JSON(http.StatusCreated, transaction)
}

func (h *TransactionHandler) GetTransactionsByUserId(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Authentication state missing"})
		return
	}

	if userId == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID is nil"})
		return
	}

	userIdStr := userId.(string)
	var transactions []models.Transaction
	err := h.DB.WithContext(c.Request.Context()).Where("user_id = ?", userIdStr).Find(&transactions).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}
	c.JSON(http.StatusOK, transactions)
}

func (h *TransactionHandler) DeleteTransaction(c *gin.Context) {
	transactionId := c.Param("id")
	if transactionId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Transaction ID is required"})
		return
	}

	err := h.DB.WithContext(c.Request.Context()).
		Where("id = ?", transactionId).
		Delete(&models.Transaction{}).
		Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete transaction",
			"err":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted successfully"})
}
