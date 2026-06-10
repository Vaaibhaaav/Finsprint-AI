package internal

import (
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/vaaaibhav/finsprint/models"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

func (c *Client) WritePump(hub *MessageHub) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		hub.Unregister <- c
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) ReadPump(hub *MessageHub) {
	defer func() {
		hub.Unregister <- c
	}()

	c.Conn.SetReadLimit(512 * 1024)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var inbound struct {
			RoomID  string `json:"room_id"`
			Content string `json:"content"`
		}

		if err := json.Unmarshal(message, &inbound); err != nil {
			log.Printf("[WS] Malformed socket payload dropped: %v", err)
			continue
		}

		roomUUID, err := uuid.Parse(inbound.RoomID)
		if err != nil {
			log.Printf("[WS] Invalid room UUID received: %s", inbound.RoomID)
			continue
		}

		dbMessage := models.Message{
			ID:        uuid.New(),
			RoomID:    roomUUID,
			SenderID:  c.ID,
			Content:   inbound.Content,
			CreatedAt: time.Now(),
		}

		// Non-blocking operations
		hub.DBWriteChan <- dbMessage
		hub.Broadcast <- dbMessage
	}
}