package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/vaaaibhav/finsprint/controllers"
	"github.com/vaaaibhav/finsprint/database"
	"github.com/vaaaibhav/finsprint/handlers"
	"github.com/vaaaibhav/finsprint/internal"
	"github.com/vaaaibhav/finsprint/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: No .env file discovered, reading system env profiles")
	}

	clerk.SetKey(os.Getenv("CLERK_SECRET_KEY"))
	fmt.Println(">>> CLERK KEY SET:", os.Getenv("CLERK_SECRET_KEY") != "")

	dbInstance, err := database.Connect()
	if err != nil {
		log.Fatalf("Critical system boot failure (Database connection): %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	
	geminiClient, err := internal.NewGeminiClient(ctx)
	if err != nil {
		log.Fatalf("Critical system boot failure (Gemini engine): %v", err)
	}

	sseHub := internal.NewHub()
	jobProcessor := &internal.JobProcessor{
		DB:           dbInstance.Client,
		Hub:          sseHub,
		GeminiClient: geminiClient,
	}

	pool := internal.NewPool(2, 100)
	pool.Start(ctx, jobProcessor.ProcessTaggingJob)
	defer pool.Shutdown()

	r := gin.Default()
	setupCors(r)

	// if err := dbInstance.Client.AutoMigrate(&models.ChatRoom{}, &models.Message{}); err != nil {
	// 	log.Fatalf("Critical system boot failure (Database migration): %v", err)
	// }

	messageHub := internal.NewMessageHub(dbInstance.Client)
	go messageHub.Run(ctx)

	pipeline := internal.NewDigestPipeline(dbInstance.Client, geminiClient)

	transactionHandler := handlers.NewTransactionHandler(dbInstance.Client, pool)
	clerkHandler := handlers.NewClerkHandler(dbInstance.Client)
	userHandler := handlers.NewUserHandler(dbInstance.Client)
	goalHandler := handlers.NewGoalHandler(dbInstance.Client)
	coachHandler := handlers.NewCoachesHandler(dbInstance.Client)
	sessionHandler := handlers.NewSessionHandler(dbInstance.Client)
	digestHandler := handlers.NewDigestHandler(dbInstance.Client, pipeline)
	msgHandler := handlers.NewMessagingHandler(dbInstance.Client, messageHub)
	aiHandler := controllers.NewAIHandler(dbInstance.Client)



	api := r.Group("/api/v1")
	{
		api.POST("/webhooks/clerk", clerkHandler.HandleClerkWebhook)
		secure := api.Group("", middleware.RequireAuth())
		{
			secure.GET("/user/user-details", userHandler.GetUser)
			
			secure.POST("/transactions", transactionHandler.CreateTransaction)
			secure.GET("/transactions", transactionHandler.GetTransactionsByUserId)
			secure.DELETE("/transactions/:id", transactionHandler.DeleteTransaction)

			secure.GET("/goals", goalHandler.GetGoalByUserId)
			secure.POST("/goals", goalHandler.CreateNewGoal)
			secure.PUT("/goals/:id", goalHandler.UpdateGoal)
			
			secure.POST("/coach", coachHandler.CreateCoach)
			secure.GET("/coach", coachHandler.GetCoaches)
			secure.POST("/coach/availability_slots", coachHandler.CreateAvailabilitySlots)
			secure.GET("/coach/availability_slots/:coach_id", coachHandler.GetAvailabilitySlotsForCoach)
			
			secure.POST("/session", sessionHandler.BookSession)
			secure.GET("/coach/sessions", sessionHandler.GetSessionsAsCoach)
			secure.GET("/user/sessions", sessionHandler.GetSessionAsUser)
			secure.POST("/coach/session/handleActions", sessionHandler.HandleSessionRequest)
			
			secure.GET("/digest/generate", digestHandler.GenerateOnDemand)
			secure.GET("/digests", digestHandler.GetDigests)
			secure.GET("/digests/:id", digestHandler.GetLastDigestByUserID)
			
			secure.POST("/chat/rooms", msgHandler.GetOrCreateRoom)
			secure.GET("/chat/rooms", msgHandler.GetAllRooms)
			secure.GET("/chat/rooms/:roomId/messages", msgHandler.GetMessages)
			
			secure.GET("/chat/ws", msgHandler.ConnectWebSocket)
			
			
			secure.POST("/ai/handle_insights",aiHandler.HandleInsightsTrigger)
			secure.POST("/ai/card_optimizer", aiHandler.HandleCardOptimizer)
			secure.POST("/ai/research", aiHandler.HandleLiveResearch)
		}
	}

	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Network socket execution interrupted: %v", err)
	}
}

func setupCors(r *gin.Engine) {
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"https://yourdomain.com",
		},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{
			"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With",
			"Sec-WebSocket-Extensions", "Sec-WebSocket-Key", "Sec-WebSocket-Version",
		},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
}