package internal

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"google.golang.org/genai"
)

type AIAnalysis struct {
	Category string `json:"category"`
	Motive   string `json:"motive"`
	RiskFlag bool   `json:"risk_flag"`
}

type GeminiClient struct {
	client *genai.Client
}

func NewGeminiClient(ctx context.Context) (*GeminiClient, error) {
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("Failed to create gemini engine: %v", err.Error())
	}
	return &GeminiClient{client: client}, nil
}

func (gc *GeminiClient) AnalyzeTransaction(ctx context.Context, description string, amount float64) (*AIAnalysis, error) {
	prompt := fmt.Sprintf(
		"Analyze this financial transaction: Description: '%s', Amount: $%.2f. Determine a precise short category name, an underlying motive description, and whether this appears risky or highly anomalous.If the transaction is ambiguous, make the best effort to infer based on the description and amount. Respond strictly in a JSON format matching the schema with fields: category (string), motive (string), risk_flag (boolean).",
		description, amount,
	)

	config := &genai.GenerateContentConfig{
		ResponseMIMEType: "application/json",
		ResponseSchema: &genai.Schema{
			Type: genai.TypeObject,
			Properties: map[string]*genai.Schema{
				"category":  {Type: genai.TypeString, Description: "Category of expense like Food & Dining, Travel, Utilities"},
				"motive":    {Type: genai.TypeString, Description: "A short sentence explaining the likely purpose"},
				"risk_flag": {Type: genai.TypeBoolean, Description: "True if suspicious or highly abnormal behavior"},
			},
			Required: []string{"category", "motive", "risk_flag"},
		},
	}

	primaryModel := "gemini-2.5-flash"
	fallbackModel := "gemini-1.5-flash"

	var resp *genai.GenerateContentResponse
	var err error

	maxRetries := 3
	backoff := 1500 * time.Millisecond
	for i := 0; i < maxRetries; i++ {
		resp, err = gc.client.Models.GenerateContent(ctx, primaryModel, genai.Text(prompt), config)
		if err == nil {
			break
		}

		if errors.Is(ctx.Err(), context.Canceled) || errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return nil, ctx.Err()
		}

		slog.Warn("Primary Gemini engine throttled or busy, backing off...", "attempt", i+1, "err", err.Error())

		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(backoff):
			backoff *= 2
		}
	}

	if err != nil {
		slog.Warn("Primary engine exhausted. Dropping back to baseline fallback model", "model", fallbackModel)
		resp, err = gc.client.Models.GenerateContent(ctx, fallbackModel, genai.Text(prompt), config)
		if err != nil {
			return nil, fmt.Errorf("both primary and fallback models failed: %w", err)
		}
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty generation response candidate from AI model")
	}

	part := resp.Candidates[0].Content.Parts[0]
	rawText := part.Text

	var analysis AIAnalysis
	if err := json.Unmarshal([]byte(rawText), &analysis); err != nil {
		return nil, fmt.Errorf("failed parsing structured schema json output: %w", err)
	}

	return &analysis, nil
}
