package internal

import (
	"context"
	"log/slog"
	"time"

	"github.com/vaaaibhav/finsprint/models"
	"gorm.io/gorm"
)

type JobProcessor struct {
	DB           *gorm.DB
	Hub          *Hub
	GeminiClient *GeminiClient
}

func (jp *JobProcessor) ProcessTaggingJob(ctx context.Context, job TaggingJob) {
	tagCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	slog.Info("Starting background AI tagging", "txID", job.TransactionID)

	analysis, err := jp.GeminiClient.AnalyzeTransaction(tagCtx, job.Description, job.Amount)
	if err != nil {
		slog.Error("Gemini analysis execution workflow failed", "txID", job.TransactionID, "err", err)
		return
	}
	mockCategory := analysis.Category
	mockMotive := analysis.Motive
	mockRiskFlag := analysis.RiskFlag

	err = jp.DB.WithContext(tagCtx).Model(&models.Transaction{}).
		Where("id = ?", job.TransactionID).
		Updates(map[string]interface{}{
			"category":     mockCategory,
			"motive":       mockMotive,
			"risk_flag":    mockRiskFlag,
			"is_ai_tagged": true,
		}).Error

	if err != nil {
		slog.Error("Database update failed during tagging workflow", "txID", job.TransactionID, "err", err)
		return
	}

	jp.Hub.Send(job.UserID, Event{
		Type: "transaction_tagged",
		Data: map[string]interface{}{
			"transaction_id": job.TransactionID,
			"category":       mockCategory,
			"motive":         mockMotive,
			"status":         "success",
		},
	})
}
