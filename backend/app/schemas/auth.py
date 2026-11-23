from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    org_id: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    organization_name: str
    organization_slug: Optional[str] = None
    industry: Optional[str] = "Automotive & Industrial Components"
    full_name: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    organization_id: str
    organization_name: Optional[str] = None
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

