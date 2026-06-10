package internal

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

const (
	batchMaxLimit = 100
	batchTimeout  = 3 * time.Second
)

type Client struct {
	ID   string
	Conn *websocket.Conn
	Send chan []byte
}

type MessageHub struct {
	DB          *gorm.DB
	Clients     map[string]*Client
	Register    chan *Client
	Unregister  chan *Client
	Broadcast   chan models.Message
	DBWriteChan chan models.Message
	mu          sync.RWMutex
}

func NewMessageHub(db *gorm.DB) *MessageHub {
	return &MessageHub{
		DB:          db,
		Clients:     make(map[string]*Client),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		Broadcast:   make(chan models.Message),
		DBWriteChan: make(chan models.Message, 5000),
	}
}

func (h *MessageHub) Run(ctx context.Context) {
	go h.startGlobalBatchWriterWorker(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.ID] = client
			h.mu.Unlock()
			log.Printf("[WS Hub] Client registered online: %s", client.ID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, exists := h.Clients[client.ID]; exists {
				delete(h.Clients, client.ID)
				close(client.Send)
				client.Conn.Close()
				log.Printf("[WS Hub] Client disconnected offline: %s", client.ID)
			}
			h.mu.Unlock()

		case msg := <-h.Broadcast:
			var room models.ChatRoom
			if err := h.DB.First(&room, "id = ?", msg.RoomID).Error; err != nil {
				log.Printf("[WS Hub] Failed to identify room for broadcast context: %v", err)
				continue
			}

			recipientID := room.UserID
			if msg.SenderID == room.UserID {
				recipientID = room.CoachID
			}

			h.mu.RLock()
			recipientClient, online := h.Clients[recipientID]
			h.mu.RUnlock()

			if online {
				payload, _ := json.Marshal(msg)
				select {
				case recipientClient.Send <- payload:
				default:
					close(recipientClient.Send)
					h.mu.Lock()
					delete(h.Clients, recipientID)
					h.mu.Unlock()
				}
			}
		}
	}
}

func (h *MessageHub) startGlobalBatchWriterWorker(ctx context.Context) {
	buffer := make([]models.Message, 0, batchMaxLimit)
	ticker := time.NewTicker(batchTimeout)
	defer ticker.Stop()

	flush := func() {
		if len(buffer) == 0 {
			return
		}
		if err := h.DB.WithContext(ctx).CreateInBatches(buffer, len(buffer)).Error; err != nil {
			log.Printf("[Global Batch Engine] CRITICAL failed to commit message slice: %v", err)
		} else {
			log.Printf("[Global Batch Engine] Successfully committed chunk block (%d messages) to Database.", len(buffer))
		}
		buffer = make([]models.Message, 0, batchMaxLimit)
	}

	for {
		select {
		case <-ctx.Done():
			flush()
			return
		case msg, ok := <-h.DBWriteChan:
			if !ok {
				flush()
				return
			}
			buffer = append(buffer, msg)
			if len(buffer) >= batchMaxLimit {
				flush()
				ticker.Reset(batchTimeout)
			}
		case <-ticker.C:
			flush()
		}
	}
}
