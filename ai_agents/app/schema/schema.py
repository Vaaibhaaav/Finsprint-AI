from pydantic import BaseModel, Field
from typing import List, Optional


class UserSchema(BaseModel):
    id: str = Field(validation_alias="Id")
    name: str = Field(validation_alias="Name")
    email: str = Field(validation_alias="Email")

class TransactionSchema(BaseModel):
    id: str
    merchant_clean: str
    debit: float
    category: str
    date: str

class UserProfileTransactionSchema(BaseModel):
    ID: str
    # Handled as a float—Pydantic automatically transforms string numbers like "1000" into raw floats
    Amount: float
    TransactionType: str = Field(validation_alias="Type")
    Merchant: str
    Category: str
    Description: str
    Motive: str

class UserProfileGoalSchema(BaseModel):
    ID: str
    Name: Optional[str] = "Goal Milestone"
    Type: Optional[str] = "Savings"
    Description: str
    TargetAmount: float
    Deadline: str
    WeeklyTarget: float
    SavedAmount: float

class UserProfileSchema(BaseModel):
    user: UserSchema
    transactions: List[UserProfileTransactionSchema] = Field(default=[])
    goals: List[UserProfileGoalSchema] = Field(default=[])

class UnifiedInboundPayload(BaseModel):
    message: Optional[str] = ""
    Transactions: Optional[str] = None
    user_profile: UserProfileSchema