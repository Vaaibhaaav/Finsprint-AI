package internal

import (
	"context"
	"sync"
)

type TaggingJob struct {
	TransactionID string
	Description   string
	Amount        float64
	UserID        string
}

type Pool struct {
	jobs    chan TaggingJob
	wg      sync.WaitGroup
	workers int
}

func NewPool(workerCount int, bufferSize int) *Pool {
	return &Pool{
		jobs:    make(chan TaggingJob, bufferSize),
		workers: workerCount,
	}
}

func (p *Pool) Start(ctx context.Context, processor func(context.Context, TaggingJob)) {
	for i := 0; i < p.workers; i++ {
		p.wg.Add(1)
		go func() {
			defer p.wg.Done()
			for {
				select {
				case job, ok := <-p.jobs:
					if !ok {
						return 
					}
					// FIX: Pass context.Background() so individual transaction tasks 
					// are isolated and self-govern their own timeouts without breaking
					processor(context.Background(), job)
					
				case <-ctx.Done():
					return 
				}
			}
		}()
	}
}

func (p *Pool) Submit(job TaggingJob) {
	p.jobs <- job
}

func (p *Pool) Shutdown() {
	close(p.jobs)
	p.wg.Wait()
}