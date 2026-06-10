package internal

import "sync"

type Event struct {
	Type string         `json:"type"`
	Data map[string]any `json:"data"`
}

type Hub struct {
	mu     sync.RWMutex
	client map[string]chan Event
}

func NewHub() *Hub {
	return &Hub{
		client: make(map[string]chan Event),
	}
}

func (h *Hub) Register(userID string) chan Event {
	h.mu.Lock()
	defer h.mu.Unlock()

	if oldCh, exists := h.client[userID]; exists {
		close(oldCh)
	}

	ch := make(chan Event, 100)
	h.client[userID] = ch
	return ch
}

func (h *Hub) Unregister(userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if ch, exists := h.client[userID]; exists {
		close(ch)
		delete(h.client, userID)
	}
}

func (h *Hub) Send(userID string, event Event) {
	h.mu.RLock()
	ch, exists := h.client[userID]
	h.mu.RUnlock()

	if exists {
		select {
		case ch <- event:
			// Event delivered to the channel buffer successfully
		default:
			// Channel buffer is completely full, dropping event to preserve server performance
		}
	}
}

