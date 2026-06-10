package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	svix "github.com/svix/svix-webhooks/go"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type ClerkHandler struct {
	db *gorm.DB
}

func NewClerkHandler(db *gorm.DB) *ClerkHandler {
	return &ClerkHandler{
		db: db,
	}
}

func (h *ClerkHandler) HandleClerkWebhook(c *gin.Context) {
	secretKey := os.Getenv("CLERK_WEBHOOK_SECRET")
	if secretKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Webhook secret is not configured"})
		return
	}

	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	wh, err := svix.NewWebhook(secretKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize webhook verifier"})
		return
	}

	if err = wh.Verify(payload, c.Request.Header); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook signature"})
		return
	}

	var event map[string]interface{}
	if err = json.Unmarshal(payload, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse JSON payload"})
		return
	}

	eventType, _ := event["type"].(string)
	data, _ := event["data"].(map[string]interface{})

	switch eventType {
	case "user.created":
		userID, _ := data["id"].(string)
		emailAddresses, _ := data["email_addresses"].([]interface{})
		firstName, _ := data["first_name"].(string)
		lastName, _ := data["last_name"].(string)
		var primaryEmail string
		if len(emailAddresses) > 0 {
			if firstEmail, ok := emailAddresses[0].(map[string]interface{}); ok {
				primaryEmail, _ = firstEmail["email_address"].(string)
			}
		}
		var user models.User
		user.Id = userID
		user.Email = primaryEmail
		name := firstName + " " + lastName
		user.Name = &name

		if err := h.db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		c.Set("Id", userID)
		println("Successfully synced new user from Clerk:", userID, primaryEmail)

	case "user.updated":
		userID, _ := data["id"].(string)
		println("User profile updated:", userID)

	case "user.deleted":
		userID, _ := data["id"].(string)
		println("User profile deleted:", userID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Webhook processed successfully"})
}
