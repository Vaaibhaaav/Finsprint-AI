package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/vaaaibhav/finsprint/internal"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type MessagingHandler struct {
	DB  *gorm.DB
	Hub *internal.MessageHub	
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Lock down with valid domain origins in production
	},
}

func NewMessagingHandler(db *gorm.DB, hub *internal.MessageHub) *MessagingHandler {
	return &MessagingHandler{DB: db, Hub: hub}
}

func (h *MessagingHandler) ConnectWebSocket(c *gin.Context) {
	clerkID, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication context missing"})
		return
	}
	actorID, ok := clerkID.(string)
	if !ok || actorID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid identification profile"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &internal.Client{
		ID:   actorID,
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	h.Hub.Register <- client

	go client.WritePump(h.Hub)
	go client.ReadPump(h.Hub)
}

func (h *MessagingHandler) GetOrCreateRoom(c *gin.Context) {
	_ , exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication context missing"})
		return
	}
	

	var req struct {
		CoachID string `json:"coach_id" binding:"required"`
		UserId string `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var room models.ChatRoom
	err := h.DB.WithContext(c.Request.Context()).Where("user_id = ? AND coach_id = ?", req.UserId, req.CoachID).First(&room).Error
	if err != nil {
		room = models.ChatRoom{
			ID:      uuid.New(),
			UserID:  req.UserId,
			CoachID: req.CoachID,
		}
		if err := h.DB.WithContext(c.Request.Context()).Create(&room).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create negotiation portal"})
			return
		}
	}

	c.JSON(http.StatusOK, room)
}

func (h *MessagingHandler) GetMessages(c *gin.Context) {
	roomIDStr := c.Param("roomId")
	roomUUID, err := uuid.Parse(roomIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room hash identification token"})
		return
	}

	var messages []models.Message
	err = h.DB.WithContext(c.Request.Context()).Where("room_id = ?", roomUUID).Order("created_at asc").Find(&messages).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract message ledger records"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (h *MessagingHandler) GetAllRooms(c *gin.Context) {
	userId, exists := c.Get("Id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userIdStr := userId.(string)

	var rooms []models.ChatRoom
	err := h.DB.Where("user_id = ? OR coach_id = ?", userIdStr, userIdStr).Order("created_at desc").Preload("User").Preload("Coach").Find(&rooms).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chat rooms"})
		return
	}
	c.JSON(http.StatusOK, rooms)
}
