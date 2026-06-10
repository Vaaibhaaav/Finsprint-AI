import { time } from "console"
import { Phone, User } from "lucide-react"

export type Role = "user" | "coach" | "admin"

export type User = {
    Id: string
    Email: string
    Name: string
    IsPro: boolean
    Role: Role
    PhoneNumber: string
    StripeCustomerID: string
    MonthlyBudget: number
    AvatarUrl: string
    Currency: string
    CreatedAt: Date
}

export type type = "expense" | "income"

export type TransactionIdentifier = "impulsive" | "well-thought" | "unknown" | "needed"

export type TransactionType = {
    ID: string
    UserID: string
    Amount: number
    Type: type
    Merchant: string
    Description: string
    Category: string
    Motive: string
    RiskFlag: boolean
    IsAITagged: boolean
    TransactionIdentifier: TransactionIdentifier
    Date: Date
    CreatedAt: Date
}

export type CreateTransactionRequest = {
    Amount: number
    Type: type
    Merchant?: string
    Description?: string
    Category?: string
    Motive: string
    Date: Date
    TransactionIdentifier: TransactionIdentifier
}

export type GoalType = {
    ID: string
    UserID: string
    Name: string
    Type: string
    Description: string
    TargetAmount: number
    SavedAmount: number
    WeeklyTarget: number
    Deadline: Date
    IsActive: boolean
    CreatedAt: Date
}

export type GoalRequest = {
    Name: string
    Type: string
    TargetAmount: number
    SavedAmount: number
    Description: string
    WeeklyTarget: number
    Deadline: Date
    IsActive?: boolean
}

export type CoachType = {
    ID: string
    Name: string
    Email: string
    Phone: string
    Bio: string | null
    Specialties: string[]
    Rating: number
    SessionPrice: number
    AvatarURL: string | null
    IsActive: boolean
    CreatedAt: Date
}

export type CoachRequest = {
    Name: string
    Email: string
    Phone: string
    Bio: string | null
    Specialties: string[]
    SessionPrice: number
    AvatarURL: string | null
}

export type Session = {
    ID: string
    UserID: string
    User?: User
    CoachID: string
    Coach?: CoachType
    SlotID: string
    Status: string
    StripePaymentID: string
    ActionItems: string
    IcsToken: string
    ScheduledAt: Date
    CreatedAt: Date
}

export type SessionRequest = {
    StripePaymentId: string
    CoachId: string
    SlotId: string
}



export enum Frequency {
    Everyday = "everyday",
    Weekly = "weekly",
    Monthly = "monthly"
}


export type AvailabilitySlot = {
    ID: string
    CoachID: string
    Coach: CoachType
    StartTime: Date
    EndTime: Date
    IsBooked: boolean
    Frequency: Frequency
}

export type AvailabilitySlotRequest = {
    StartTime: Date
    EndTime: Date
    Frequency: Frequency
}

export type Digests = {
    ID: string
    UserID: string
    User: User
    WeekStart: Date
    WeekEnd: Date
    Summary: string
    TopCategory: string
    TotalSpent: number
    TotalIncome: number
    ImpulseCount: number
    RiskFlags: number
    GoalStatus: string
    Status: string
    RawJSON: string
    CreatedAt: Date
}

export type ChatRoom = {
  ID: string;
  UserID: string;
  CoachID: string;
  User : User;
  Coach : CoachType;
  CreatedAt: string;
}

export type Message = {
  ID: string;
  RoomID: string;
  SenderID: string;
  Content: string;
  IsRead: boolean;
  CreatedAt: string;
  isOptimistic?: boolean; 
}