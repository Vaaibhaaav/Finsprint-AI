package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/shopspring/decimal"
)

type Role string

const (
	RoleUser  Role = "user"
	RoleCoach Role = "coach"
)

type User struct {
	Id               string           `gorm:"type:text;primaryKey"`
	Email            string           `gorm:"type:text;not null"`
	Name             *string          `gorm:"type:text"`
	IsPro            bool             `gorm:"type:boolean;default:false"`
	Role             Role             `gorm:"type:text;default:'user'"`
	PhoneNumber      *string          `gorm:"type:text"`
	StripeCustomerID *string          `gorm:"type:text"`
	MonthlyBudget    *decimal.Decimal `gorm:"type:numeric(10,2)"`
	AvatarUrl        *string          `gorm:"type:text"`
	Currency         string           `gorm:"type:text;default:'USD'"`
	CreatedAt        time.Time        `gorm:"type:timestamptz;default:now()"`
}

type TransactionType string

const (
	TransactionExpense TransactionType = "expense"
	TransactionIncome  TransactionType = "income"
)

type TransactionIdentifier string

const (
	TransactionIdentifierImpulsive   TransactionIdentifier = "impulsive"
	TransactionIdentifierWellThought TransactionIdentifier = "well-thought"
	TransactionIdentifierUnknown     TransactionIdentifier = "unknown"
	TransactionIdentifierNeeded      TransactionIdentifier = "needed"
)

type Transaction struct {
	ID                    uuid.UUID             `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID                *string               `gorm:"type:text;not null;aindex:idx_transactions_user_id;constraint:OnDelete:CASCADE"`
	User                  *User                 `gorm:"foreignKey:UserID"`
	Amount                decimal.Decimal       `gorm:"type:numeric(10,2);not null"`
	Type                  TransactionType       `gorm:"type:text;not null"`
	Merchant              *string               `gorm:"type:text"`
	Description           *string               `gorm:"type:text"`
	Category              *string               `gorm:"type:text"`
	Motive                string                `gorm:"type:text;default:'Untagged'"`
	RiskFlag              bool                  `gorm:"type:boolean;default:false"`
	IsAITagged            bool                  `gorm:"type:boolean;default:false"`
	TransactionIdentifier TransactionIdentifier `gorm:"type:text;default:'unknown'"`
	Date                  time.Time             `gorm:"type:timestamptz;not null;index:idx_transactions_date,priority:1,order:desc"`
	CreatedAt             time.Time             `gorm:"type:timestamptz;default:now()"`
}
type Goals struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID       *string    `gorm:"type:text;not null;index:idx_goals_user_id;constraint:OnDelete:CASCADE"`
	User         *User      `gorm:"foreignKey:UserID"`
	Name         string     `gorm:"type:text;not null"`
	Type         string     `gorm:"type:text;not null"`
	Description  *string    `gorm:"type:text"`
	TargetAmount float64    `gorm:"type:numeric(10,2);not null;binding:numeric"`
	SavedAmount  float64    `gorm:"type:numeric(10,2);binding:numeric"`
	WeeklyTarget *float64   `gorm:"type:numeric(10,2)"`
	Deadline     *time.Time `gorm:"type:timestamptz"`
	IsActive     bool       `gorm:"type:boolean;default:true"`
	CreatedAt    time.Time  `gorm:"type:timestamptz;default:now()"`
}
type Digests struct {
	ID           uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID       *string         `gorm:"type:text;not null;index:idx_digests_user_id;constraint:OnDelete:CASCADE"`
	User         *User           `gorm:"foreignKey:UserID"`
	WeekStart    time.Time       `gorm:"type:timestamptz;not null"`
	WeekEnd      time.Time       `gorm:"type:timestamptz;not null"`
	Summary      string          `gorm:"type:text;not null"`
	TopCategory  string          `gorm:"type:text"`
	TotalSpent   decimal.Decimal `gorm:"type:numeric(10,2)"`
	TotalIncome  decimal.Decimal `gorm:"type:numeric(10,2)"`
	ImpulseCount int             `gorm:"type:int;default:0"`
	RiskFlags    int             `gorm:"type:int;default:0"`
	GoalStatus   string          `gorm:"type:jsonb"`
	Status       string          `gorm:"type:text;default:'processing'"`
	RawJSON      string          `gorm:"type:jsonb"`
	CreatedAt    time.Time       `gorm:"type:timestamptz;default:now()"`
}

type Coach struct {
	ID           string         `gorm:"type:text;primaryKey"`
	Name         string         `gorm:"type:text;not null"`
	Email        string         `gorm:"type:text;not null"`
	Phone        string         `gorm:"type:text"`
	Bio          *string        `gorm:"type:text"`
	Specialties  pq.StringArray `gorm:"type:text[]"`
	Rating       float32        `gorm:"type:numeric(3,2);default:5.0;binding:numeric"`
	SessionPrice float64        `gorm:"type:numeric(10,2);default:25.00;binding:numeric"`
	AvatarURL    *string        `gorm:"type:text"`
	IsActive     bool           `gorm:"type:boolean;default:true"`
	CreatedAt    time.Time      `gorm:"type:timestamptz;default:now()"`
}

type Session struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID          *string    `gorm:"type:text;not null;index:idx_sessions_user_id;constraint:OnDelete:CASCADE"`
	User            *User      `gorm:"foreignKey:UserID"`
	CoachID         *string    `gorm:"type:text;not null;index:idx_sessions_coach_id;constraint:OnDelete:CASCADE"`
	Coach           *Coach     `gorm:"foreignKey:CoachID"`
	SlotID          *uuid.UUID `gorm:"type:uuid;index:idx_sessions_slot_id;constraint:OnDelete:SET NULL"`
	Status          string     `gorm:"type:text;default:'pending'"`
	StripePaymentID *string    `gorm:"type:text;unique"`
	ActionItems     string     `gorm:"type:jsonb"`
	IcsToken        string     `gorm:"type:text;unique;default:md5(random()::text)"`
	ScheduledAt     time.Time  `gorm:"type:timestamptz;not null"`
	CreatedAt       time.Time  `gorm:"type:timestamptz;default:now()"`
}

type Frequency string

const (
	FrequencyEveryday Frequency = "everyday"
	FrequencyWeekly   Frequency = "weekly"
	FrequencyMonthly  Frequency = "monthly"
)

type AvailabilitySlot struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CoachID   string    `gorm:"type:text;not null;index:idx_slots_coach_id;constraint:OnDelete:CASCADE"`
	Coach     *Coach    `gorm:"foreignKey:CoachId"`
	StartTime time.Time `gorm:"type:timestamptz;not null"`
	EndTime   time.Time `gorm:"type:timestamptz;not null"`
	IsBooked  bool      `gorm:"type:boolean;default:false"`
	Frequency Frequency `gorm:"type:text;default:'everyday'"`
}

type Rating struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CoachID   string    `gorm:"type:text;not null;index:idx_ratings_coach_id"`
	UserID    string    `gorm:"type:text;not null;"`
	Coach     *Coach    `gorm:"foreignKey:CoachID;references:ID;constraint:OnDelete:CASCADE"`
	Rating    int8      `gorm:"type:smallint;not null"`
	Review    string    `gorm:"type:text"`
	CreatedAt time.Time `gorm:"type:timestamptz;default:now()"`
}

type ChatRoom struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string    `gorm:"type:text;not null;index:idx_rooms_user_id;constraint:OnDelete:CASCADE"`
	User      *User     `gorm:"foreignKey:UserID"`
	CoachID   string    `gorm:"type:text;not null;index:idx_rooms_coach_id;constraint:OnDelete:CASCADE"`
	Coach     *Coach    `gorm:"foreignKey:CoachID"`
	CreatedAt time.Time `gorm:"type:timestamptz;default:now()"`
	Messages  []Message `gorm:"foreignKey:RoomID;constraint:OnDelete:CASCADE"`
}

type Message struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	RoomID    uuid.UUID `gorm:"type:uuid;not null;index:idx_messages_room_id"`
	SenderID  string    `gorm:"type:text;not null"`
	Content   string    `gorm:"type:text;not null"`
	IsRead    bool      `gorm:"type:boolean;default:false"`
	CreatedAt time.Time `gorm:"type:timestamptz;default:now()"`
}