package internal

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"github.com/vaaaibhav/finsprint/models"
	"google.golang.org/genai"
	"gorm.io/gorm"
)

type DigestResult struct {
	UserID   string
	Email    string
	DigestID uuid.UUID
	Digest   *models.Digests
	Err      error
}

type DigestPipeline struct {
	DB           *gorm.DB
	GeminiClient *GeminiClient
}

func NewDigestPipeline(db *gorm.DB, geminiClient *GeminiClient) *DigestPipeline {
	return &DigestPipeline{DB: db, GeminiClient: geminiClient}
}

func (p *DigestPipeline) RunUserDigestPipeline(ctx context.Context, user models.User, trackingID uuid.UUID, start, end time.Time) {
	log.Printf("[Pipeline] Initializing targeted on-demand engine processing for user: %s", user.Id)

	jobsChan := make(chan models.User, 1)
	resultsChan := make(chan DigestResult, 1)

	var workerWg sync.WaitGroup
	workerWg.Add(1)

	go func() {
		defer workerWg.Done()
		p.digestWorkerConsumer(ctx, 1, jobsChan, resultsChan, trackingID, start, end)
	}()

	jobsChan <- user
	close(jobsChan)

	var writerWg sync.WaitGroup
	writerWg.Add(1)
	go func() {
		defer writerWg.Done()
		p.singleWriterCollector(resultsChan)
	}()

	workerWg.Wait()
	close(resultsChan)
	writerWg.Wait()

	log.Printf("[Pipeline] Execution cycle completed cleanly for digest tracking unit: %s", trackingID.String())
}

func (p *DigestPipeline) digestWorkerConsumer(ctx context.Context, id int, jobs <-chan models.User, results chan<- DigestResult, trackingID uuid.UUID, start, end time.Time) {
	for user := range jobs {
		var txs []models.Transaction
		err := p.DB.WithContext(ctx).
			Where("user_id = ? AND date BETWEEN ? AND ?", user.Id, start, end).
			Find(&txs).Error

		if err != nil {
			results <- DigestResult{UserID: user.Id, Email: user.Email, DigestID: trackingID, Err: err}
			continue
		}

		aiReport, err := p.executeGeminiAnalysis(ctx, user, txs, start, end)
		if err != nil {
			results <- DigestResult{UserID: user.Id, Email: user.Email, DigestID: trackingID, Err: err}
			continue
		}

		aiReport.ID = trackingID
		aiReport.Status = "completed"

		results <- DigestResult{
			UserID:   user.Id,
			Email:    user.Email,
			DigestID: trackingID,
			Digest:   aiReport,
			Err:      nil,
		}
	}
}

func (p *DigestPipeline) singleWriterCollector(results <-chan DigestResult) {
	for res := range results {
		if res.Err != nil {
			log.Printf("[Collector] Run configuration failed. Marking digest row %s as failed: %v", res.DigestID.String(), res.Err)
			p.markRowAsFailed(context.Background(), res.DigestID, res.Err.Error())
			continue
		}

		err := p.DB.Model(&models.Digests{}).
			Where("id = ?", res.DigestID).
			Updates(res.Digest).Error

		if err != nil {
			log.Printf("[Collector] CRITICAL: Failed to save final payload block state to Neon DB: %v", err)
			continue
		}

		log.Printf("[Collector] Successfully verified update for tracking digest: %s", res.DigestID.String())

		go p.dispatchEmailNotification(res.Email, res.Digest.Summary)
	}
}

func (p *DigestPipeline) markRowAsFailed(ctx context.Context, id uuid.UUID, cause string) {
	p.DB.WithContext(ctx).Model(&models.Digests{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":  "failed",
		"summary": "AI processing cycle halted: " + cause,
	})
}

type GoalStatusReport struct {
	GoalName     string  `json:"goal_name"`
	TargetAmount float64 `json:"target_amount"`
	SavedAmount  float64 `json:"saved_amount"`
	Status       string  `json:"status"` // "On Track", "Behind", "Completed"
	Feedback     string  `json:"feedback"`
}

type WeeklyDigestAIResponse struct {
	Summary            string             `json:"summary"`
	SuggestedBudgetTip string             `json:"suggested_budget_tip"`
	GoalReports        []GoalStatusReport `json:"goal_reports"`
}

func (p *DigestPipeline) executeGeminiAnalysis(ctx context.Context, user models.User, txs []models.Transaction, start, end time.Time) (*models.Digests, error) {
	var goals []models.Goals
	if err := p.DB.WithContext(ctx).Where("user_id = ? AND is_active = ?", user.Id, true).Find(&goals).Error; err != nil {
		log.Printf("[Pipeline] Warning: Failed to query goals context for user %s: %v", user.Id, err)
	}

	var totalSpent decimal.Decimal
	var totalIncome decimal.Decimal
	var impulseCounter int
	var riskCounter int
	categoryTotals := make(map[string]decimal.Decimal)

	type TxSnapshot struct {
		Date       string          `json:"date"`
		Amount     decimal.Decimal `json:"amount"`
		Type       string          `json:"type"`
		Merchant   string          `json:"merchant,omitempty"`
		Category   string          `json:"category,omitempty"`
		Identifier string          `json:"identifier"`
		RiskFlag   bool            `json:"risk_flag"`
	}
	var txSnapshots []TxSnapshot

	for _, tx := range txs {
		merchantStr := ""
		if tx.Merchant != nil {
			merchantStr = *tx.Merchant
		}
		catStr := "Unknown"
		if tx.Category != nil {
			catStr = *tx.Category
		}

		txSnapshots = append(txSnapshots, TxSnapshot{
			Date:       tx.Date.Format("2006-01-02"),
			Amount:     tx.Amount,
			Type:       string(tx.Type),
			Merchant:   merchantStr,
			Category:   catStr,
			Identifier: string(tx.TransactionIdentifier),
			RiskFlag:   tx.RiskFlag,
		})

		if tx.Type == models.TransactionExpense {
			totalSpent = totalSpent.Add(tx.Amount)
			categoryTotals[catStr] = categoryTotals[catStr].Add(tx.Amount)
			if tx.TransactionIdentifier == models.TransactionIdentifierImpulsive {
				impulseCounter++
			}
		} else {
			totalIncome = totalIncome.Add(tx.Amount)
		}

		if tx.RiskFlag {
			riskCounter++
		}
	}

	detectedTopCategory := "None"
	var maxExpense decimal.Decimal
	for cat, total := range categoryTotals {
		if total.GreaterThan(maxExpense) {
			maxExpense = total
			detectedTopCategory = cat
		}
	}

	contextPayload := map[string]interface{}{
		"aggregates": map[string]interface{}{
			"total_spent":        totalSpent,
			"total_income":       totalIncome,
			"impulse_item_count": impulseCounter,
			"risk_flags_raised":  riskCounter,
			"top_category":       detectedTopCategory,
		},
		"saving_goals": goals,
		"transactions": txSnapshots,
	}

	rawContextBytes, _ := json.MarshalIndent(contextPayload, "", "  ")

	prompt := fmt.Sprintf(
		"You are a stellar personal wealth coach. Analyze this structured weekly balance snapshot from %s to %s:\n\n%s\n\n"+
			"Draft an engaging markdown spending narrative summary, evaluate their visual goals progress status, and share a tactical budgeting tip.",
		start.Format("2006-01-02"), end.Format("2006-01-02"), string(rawContextBytes),
	)

	config := &genai.GenerateContentConfig{
		ResponseMIMEType: "application/json",
		ResponseSchema: &genai.Schema{
			Type: genai.TypeObject,
			Properties: map[string]*genai.Schema{
				"summary":              {Type: genai.TypeString, Description: "Conversational analytical overview of habits, wins, or warning signs. Supports clean Markdown formatting."},
				"suggested_budget_tip": {Type: genai.TypeString, Description: "One precise actionable advice nugget tailored to this week's transactional history."},
				"goal_reports": {
					Type:        genai.TypeArray,
					Description: "Status progress monitoring matrix for each provided saving goal.",
					Items: &genai.Schema{
						Type: genai.TypeObject,
						Properties: map[string]*genai.Schema{
							"goal_name":     {Type: genai.TypeString},
							"target_amount": {Type: genai.TypeNumber},
							"saved_amount":  {Type: genai.TypeNumber},
							"status":        {Type: genai.TypeString, Description: "Must extract to either 'On Track', 'Behind', or 'Completed'"},
							"feedback":      {Type: genai.TypeString, Description: "Coach analysis recommendation snippet for hitting the target milestone."},
						},
						Required: []string{"goal_name", "target_amount", "saved_amount", "status", "feedback"},
					},
				},
			},
			Required: []string{"summary", "suggested_budget_tip", "goal_reports"},
		},
	}

	var resp *genai.GenerateContentResponse
	var err error
	primaryModel := "gemini-2.5-flash"
	fallbackModel := "gemini-1.5-flash"

	maxRetries := 3
	backoff := 1500 * time.Millisecond
	for i := 0; i < maxRetries; i++ {
		resp, err = p.GeminiClient.client.Models.GenerateContent(ctx, primaryModel, genai.Text(prompt), config)
		if err == nil {
			break
		}
		if errors.Is(ctx.Err(), context.Canceled) || errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return nil, ctx.Err()
		}
		log.Printf("[Pipeline] Primary Gemini engine throttled. Backing off (Attempt %d)...", i+1)
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(backoff):
			backoff *= 2
		}
	}

	if err != nil {
		log.Printf("[Pipeline] Falling back to baseline model %s", fallbackModel)
		resp, err = p.GeminiClient.client.Models.GenerateContent(ctx, fallbackModel, genai.Text(prompt), config)
		if err != nil {
			return nil, fmt.Errorf("both primary and fallback intelligence pipelines failed: %w", err)
		}
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty generation response part tokens received from Gemini")
	}

	rawText := resp.Candidates[0].Content.Parts[0].Text
	var aiResponse WeeklyDigestAIResponse
	if err := json.Unmarshal([]byte(rawText), &aiResponse); err != nil {
		return nil, fmt.Errorf("failed parsing structured schema digest json: %w", err)
	}

	goalStatusJSON, err := json.Marshal(aiResponse.GoalReports)
	if err != nil {
		return nil, fmt.Errorf("failed to process goal status fields: %w", err)
	}

	combinedNarrative := fmt.Sprintf("%s\n\n### 💡 Weekly Actionable Strategy\n%s", aiResponse.Summary, aiResponse.SuggestedBudgetTip)

	return &models.Digests{
		UserID:       &user.Id,
		WeekStart:    start,
		WeekEnd:      end,
		Summary:      combinedNarrative,
		TopCategory:  detectedTopCategory,
		TotalSpent:   totalSpent,
		TotalIncome:  totalIncome,
		ImpulseCount: impulseCounter,
		RiskFlags:    riskCounter,
		GoalStatus:   string(goalStatusJSON),
		RawJSON:      rawText,
	}, nil
}

func (p *DigestPipeline) dispatchEmailNotification(email, content string) {
	if email == "" {
		return
	}
}
