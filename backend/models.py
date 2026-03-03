"""
Pydantic models for API requests and responses
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


# ==================== AUTH MODELS ====================

class TokenData(BaseModel):
    """Decoded Firebase ID token data"""
    uid: str
    email: str
    email_verified: bool
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    iss: str
    aud: str
    auth_time: int
    user_id: str
    sub: str
    iat: int
    exp: int
    firebase: Dict[str, Any]
    custom_claims: Optional[Dict[str, Any]] = None


class UserInfo(BaseModel):
    """User information from Firebase"""
    uid: str
    email: str
    email_verified: bool
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    disabled: bool
    custom_claims: Optional[Dict[str, Any]] = None


class RefreshTokenRequest(BaseModel):
    """Request to refresh Firebase token"""
    idToken: str = Field(..., description="Current Firebase ID token")


class SignupRequest(BaseModel):
    """User signup request"""
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr


class SetCustomClaimsRequest(BaseModel):
    """Request to set custom claims on user"""
    role: Optional[str] = None
    org_id: Optional[str] = None
    additional_claims: Optional[Dict[str, Any]] = None


# ==================== USER MODELS ====================

class UserProfile(BaseModel):
    """Extended user profile"""
    uid: str
    email: str
    display_name: Optional[str] = None
    organization_id: Optional[str] = None
    role: Optional[str] = None
    permissions: List[str] = []
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    status: str = "active"  # active, inactive, suspended
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== ORGANIZATION MODELS ====================

class Organization(BaseModel):
    """Organization/Tenant model"""
    id: str
    name: str
    slug: str
    owner_id: str
    industry: Optional[str] = None
    size: Optional[str] = None
    country: Optional[str] = None
    status: str = "active"  # active, suspended, deleted
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrganizationMember(BaseModel):
    """Organization membership"""
    id: str
    organization_id: str
    user_id: str
    role: str  # owner, admin, member, viewer
    status: str = "active"  # active, pending_invite, invited, disabled
    joined_at: datetime
    custom_permissions: List[str] = []

    class Config:
        from_attributes = True


# ==================== RESPONSE MODELS ====================

class ApiResponse(BaseModel, extra='allow'):
    """Generic API response wrapper"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorDetail(BaseModel):
    """Detailed error information"""
    field: Optional[str] = None
    code: str
    message: str


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    success: bool
    data: List[Dict[str, Any]]
    pagination: Dict[str, Any]
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    firebase_initialized: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==================== BILLING MODELS ====================

class BillingPlan(BaseModel):
    """Billing plan information"""
    id: str
    name: str
    slug: str
    monthly_price: float
    yearly_price: float
    currency: str = "USD"
    features: List[str] = []
    limits: Dict[str, int] = {}
    status: str = "active"


class BillingSubscription(BaseModel):
    """Active subscription"""
    id: str
    organization_id: str
    stripe_subscription_id: str
    plan_id: str
    plan_name: str
    status: str  # active, canceled, expired
    current_period_start: datetime
    current_period_end: datetime
    auto_renew: bool = True
    created_at: datetime
    canceled_at: Optional[datetime] = None


# ==================== API KEY MODELS ====================

class ApiKey(BaseModel):
    """API key for programmatic access"""
    id: str
    organization_id: str
    name: str
    key_hash: str
    scopes: List[str]  # read, write, delete, admin
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    status: str = "active"
    created_at: datetime


# ==================== WEBHOOK MODELS ====================

class WebhookEvent(BaseModel):
    """Webhook event definition"""
    event_type: str  # user.created, subscription.updated, etc.
    timestamp: datetime
    data: Dict[str, Any]
    organization_id: str


class Webhook(BaseModel):
    """Webhook configuration"""
    id: str
    organization_id: str
    url: str
    events: List[str]
    is_active: bool = True
    secret: str  # For HMAC signature verification
    created_at: datetime


# ==================== AUDIT LOG MODELS ====================

class AuditLog(BaseModel):
    """Audit log entry"""
    id: str
    organization_id: str
    user_id: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str = "success"  # success, failure
    timestamp: datetime


# ==================== ENUM MODELS ====================

class RoleEnum(str, Enum):
    """User roles"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class PermissionEnum(str, Enum):
    """User permissions"""
    USER_CREATE = "user.create"
    USER_READ = "user.read"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    ORG_MANAGE = "org.manage"
    BILLING_MANAGE = "billing.manage"
    BILLING_VIEW = "billing.view"
    API_KEY_MANAGE = "api_key.manage"
    WEBHOOK_MANAGE = "webhook.manage"
    AUDIT_READ = "audit.read"
