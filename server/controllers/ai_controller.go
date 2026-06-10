package controllers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type UserProfile struct {
	User         *models.User         `json:"user"`
	Transactions []models.Transaction `json:"transactions"`
	Goals        []models.Goals       `json:"goals"`
}

type AIRequestPayload struct {
	Message      string      `json:"message,omitempty"`
	Transactions []byte      `json:"Transactions,omitempty"` 
	UserProfile  UserProfile `json:"user_profile"`
}

type ResearchRequestPayload struct {
	Message     string        `json:"message"`
	History     []interface{} `json:"history"`
	UserProfile UserProfile   `json:"user_profile"`
}

type AiHandler struct {
	db *gorm.DB
}

func NewAIHandler(dbInstance *gorm.DB) *AiHandler {
	return &AiHandler{
		db: dbInstance,
	}
}

func RouteToAI(endpoint string, payload interface{}) (map[string]interface{}, error) {
	log.Printf("[AI ROUTER] Initializing serialization pipeline for endpoint: /api/v1/agent/%s", endpoint)
	
	// 1. Marshal the raw data payload structure
	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[AI ROUTER ERROR] JSON marshaling failed: %v", err)
		return nil, err
	}

	// =========================================================================
	// CRITICAL INSPECTION LOGGER BLOCK
	// =========================================================================
	var prettyJSON bytes.Buffer
	if err := json.Indent(&prettyJSON, jsonBytes, "", "  "); err == nil {
		log.Printf("\n🎯 --- RAW OUTBOUND JSON PAYLOAD TO AGENT /%s ---\n%s\n--------------------------------------------------", 
			endpoint, prettyJSON.String())
	} else {
		log.Printf("[AI ROUTER WARNING] Could not format raw JSON string for tracking logs: %v", err)
	}
	// =========================================================================

	baseUrl := os.Getenv("PYTHON_AI_SERVICE_URL")
	if baseUrl == "" {
		baseUrl = "http://localhost:8000"
	}
	pythonServiceURL := baseUrl + "/api/v1/agent/" + endpoint
	log.Printf("[AI ROUTER] Forwarding request to downstream target: %s", pythonServiceURL)

	client := &http.Client{Timeout: 300 * time.Second}
	resp, err := client.Post(pythonServiceURL, "application/json", bytes.NewBuffer(jsonBytes))
	if err != nil {
		log.Printf("[AI ROUTER ERROR] Private network dispatch failed: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	log.Printf("[AI ROUTER] Connection successful. HTTP Status Code received: %d", resp.StatusCode)

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("[AI ROUTER ERROR] Decoding response body failed: %v", err)
		return nil, err
	}
	
	log.Printf("[AI ROUTER] Successfully parsed response from agent /%s", endpoint)
	return result, nil
}

func (h *AiHandler) HandleInsightsTrigger(c *gin.Context) {
	log.Println("\n=========================================")
	log.Println("[GATEWAY] Received request on HandleInsightsTrigger")
	
	userId, exists := c.Get("Id")
	if !exists {
		log.Println("[GATEWAY ERROR] Unauthorized client entry: Auth key context missing")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication context missing"})
		return
	}
	userIdStr := userId.(string)
	log.Printf("[GATEWAY] Context authenticated. Target UserID: %s", userIdStr)

	var payload AIRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("[GATEWAY ERROR] JSON Bind failure: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload signature",
			"details": err.Error(),
		})
		return
	}

	log.Printf("[GATEWAY DATA] Message field parsed: '%s', Base64 Inbound Transactions byte array length: %d", payload.Message, len(payload.Transactions))

	if len(payload.Transactions) == 0 {
		log.Println("[GATEWAY ERROR] Aborting. Field 'Transactions' is absent or empty array slice.")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bank statement file payload field ('Transactions') is missing or empty"})
		return
	}

	log.Println("[GORM PIPELINE] Querying Neon DB entities...")
	var user models.User
	if err := h.db.First(&user, "id = ?", userIdStr).Error; err != nil {
		log.Printf("[GORM ERROR] Failed to fetch baseline user row: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User baseline profile record not found"})
		return
	}

	var transactions []models.Transaction
	h.db.Where("user_id = ?", userIdStr).Find(&transactions)
	var goals []models.Goals
	h.db.Where("user_id = ?", userIdStr).Find(&goals)

	log.Printf("[GORM SUCCESS] Retrieved DB arrays. Total registered transactions: %d, Total active financial goals: %d", len(transactions), len(goals))

	payload.UserProfile = UserProfile{
		User:         &user,
		Transactions: transactions,
		Goals:        goals,
	}

	if payload.Message == "" {
		payload.Message = "Analyze this uploaded statement for anomalies"
	}

	aiResult, err := RouteToAI("insights", payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal AI calculation service unreachable",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, aiResult)
}

func (h *AiHandler) HandleCardOptimizer(c *gin.Context) {
	log.Println("\n=========================================")
	log.Println("[GATEWAY] Received request on HandleCardOptimizer")

	userId, exists := c.Get("Id")
	if !exists {
		log.Println("[GATEWAY ERROR] Unauthorized client entry: Auth key context missing")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication context missing"})
		return
	}
	userIdStr := userId.(string)

	var payload AIRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("[GATEWAY ERROR] JSON Bind failure: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	log.Println("[GORM PIPELINE] Injecting verified parameters for reward optimization engine...")
	var user models.User
	if err := h.db.First(&user, "id = ?", userIdStr).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User baseline profile record not found"})
		return
	}
	var transactions []models.Transaction
	h.db.Where("user_id = ?", userIdStr).Find(&transactions)
	var goals []models.Goals
	h.db.Where("user_id = ?", userIdStr).Find(&goals)

	
	payload.UserProfile = UserProfile{
		User:         &user,
		Transactions: transactions,
		Goals:        goals,
	}

	log.Printf("[GATEWAY DATA] Forwarding context. Message Prompt: '%s', Scoring History Size: %d", payload.Message, len(transactions))

	aiResult, err := RouteToAI("card_optimizer", payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal AI calculation service unreachable", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, aiResult)
}

func (h *AiHandler) HandleLiveResearch(c *gin.Context) {
	log.Println("\n=========================================")
	log.Println("[GATEWAY] Received request on HandleLiveResearch")

	userId, exists := c.Get("Id")
	if !exists {
		log.Println("[GATEWAY ERROR] Unauthorized client entry: Auth key context missing")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User authentication context missing"})
		return
	}
	userIdStr := userId.(string)

	var payload ResearchRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("[GATEWAY ERROR] JSON Bind failure: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	log.Println("[GORM PIPELINE] Injecting user parameters to prevent live research gating failures...")
	var user models.User
	if err := h.db.First(&user, "id = ?", userIdStr).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User baseline profile record not found"})
		return
	}
	var transactions []models.Transaction
	h.db.Where("user_id = ?", userIdStr).Find(&transactions)
	var goals []models.Goals
	h.db.Where("user_id = ?", userIdStr).Find(&goals)

	payload.UserProfile = UserProfile{
		User:         &user,
		Transactions: transactions,
		Goals:        goals,
	}

	log.Printf("[GATEWAY DATA] User prompt context: '%s', Extracted Chat History items: %d", payload.Message, len(payload.History))

	aiResult, err := RouteToAI("research", payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal AI calculation service unreachable", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, aiResult)
}