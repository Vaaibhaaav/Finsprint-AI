package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	Client *gorm.DB
}


func Connect() (*Database, error) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("[DATABASE CONNECTION ERROR] Can not find .env file")
	}
	dsn := os.Getenv("POSTGRES_DB_URL")
	if dsn == "" {
		return nil, fmt.Errorf("database initialization failed: POSTGRES_DB_URL environment variable is empty")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), 
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open gorm connection: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to access underlying sql driver pool: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("database ping transaction failed: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return &Database{Client: db}, nil
}