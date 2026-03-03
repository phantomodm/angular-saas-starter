"""
FastAPI Application Entry Point
Firebase JWT Authentication + Multi-tenant SaaS Backend
"""

import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse
from dotenv import load_dotenv

from backend.firebase_service import firebase_service
from backend.stripe_service import stripe_service
from backend.database import get_firestore_db
from backend.dependencies import verify_token, get_current_user, verify_organization_access, require_admin
from backend.models import TokenData, UserInfo, ApiResponse, HealthCheckResponse
from backend.routes import billing, teams

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== APP LIFESPAN ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Startup: Initialize Firebase and services
    Shutdown: Clean up resources
    """
    # Startup
    logger.info("=" * 50)
    logger.info("Starting FastAPI Application")
    logger.info("=" * 50)
    
    try:
        # Initialize Firebase Admin SDK
        logger.info("Initializing Firebase Admin SDK...")
        firebase_service  # Triggers singleton initialization
        logger.info("✓ Firebase Admin SDK initialized successfully")
        
        # Initialize Stripe
        logger.info("Initializing Stripe SDK...")
        stripe_service  # Triggers singleton initialization
        logger.info("✓ Stripe SDK initialized successfully")
        
        # Initialize Firestore
        logger.info("Initializing Firestore...")
        firestore_db = get_firestore_db()
        logger.info("✓ Firestore initialized successfully")
        
        # Log configuration
        logger.info(f"✓ CORS Origins: {os.getenv('API_ALLOWED_ORIGINS')}")
        logger.info(f"✓ Firebase Project: {os.getenv('FIREBASE_PROJECT_ID')}")
        logger.info(f"✓ Stripe Configured: {bool(os.getenv('STRIPE_API_KEY'))}")
        logger.info(f"✓ Debug Mode: {os.getenv('DEBUG')}")
        
        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Failed to initialize application: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("=" * 50)
    logger.info("Shutting down FastAPI Application")
    logger.info("=" * 50)


# ==================== CREATE APP ====================

app = FastAPI(
    title="Angular SaaS API",
    description="Firebase JWT authenticated FastAPI backend for SaaS applications",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

logger.info("FastAPI app created")


# ==================== INCLUDE ROUTERS ====================

app.include_router(billing.router)
app.include_router(teams.router)

logger.info("All routers included")


# ==================== MIDDLEWARE ====================

# Add CORS middleware
allowed_origins = os.getenv('API_ALLOWED_ORIGINS', 'http://localhost:4200').split(',')
allowed_origins = [origin.strip() for origin in allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Organization-Id", "X-Total-Count", "X-Page", "X-Page-Size"],
    max_age=600,
)

logger.info(f"CORS configured for origins: {allowed_origins}")


# ==================== EXCEPTION HANDLERS ====================

@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError):
    """Handle ValueError from token verification"""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc), "error_type": "value_error"}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "error_type": "internal_error"}
    )


# ==================== ROUTES: HEALTH ====================

@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["Health"],
    summary="Health Check"
)
async def health_check() -> HealthCheckResponse:
    """
    Health check endpoint.
    Returns the status of the API and Firebase initialization.
    """
    return HealthCheckResponse(
        status="healthy",
        service="angular-saas-api",
        firebase_initialized=firebase_service.get_app() is not None
    )


# ==================== ROUTES: AUTH ====================

@app.post(
    "/api/auth/verify-token",
    response_model=ApiResponse,
    tags=["Authentication"],
    summary="Verify Firebase Token"
)
async def verify_firebase_token(
    token_data: TokenData = Depends(verify_token)
) -> ApiResponse:
    """
    Verify Firebase ID token and return decoded information.
    
    Used for validating tokens and debugging.
    
    **Headers:**
    - Authorization: Bearer {firebase_id_token}
    
    **Returns:**
    - Token validity status
    - Decoded claims
    - Custom claims (role, org_id, permissions)
    """
    return ApiResponse(
        success=True,
        data={
            'uid': token_data.uid,
            'email': token_data.email,
            'email_verified': token_data.email_verified,
            'display_name': token_data.display_name,
            'custom_claims': token_data.custom_claims,
            'token_issued_at': datetime.fromtimestamp(token_data.iat),
            'token_expires_at': datetime.fromtimestamp(token_data.exp)
        }
    )


# ==================== ROUTES: USER ====================

@app.get(
    "/api/user/profile",
    response_model=ApiResponse,
    tags=["User"],
    summary="Get Current User Profile"
)
async def get_current_user_profile(
    user: UserInfo = Depends(get_current_user)
) -> ApiResponse:
    """
    Get authenticated user's profile information from Firebase.
    
    **Requirements:**
    - Valid Firebase ID token in Authorization header
    
    **Returns:**
    - User UID
    - Email address
    - Display name
    - Custom claims (role, org_id, permissions)
    - Account status (verified, disabled, etc.)
    """
    return ApiResponse(
        success=True,
        data=user.model_dump()
    )


@app.post(
    "/api/user/logout",
    response_model=ApiResponse,
    tags=["User"],
    summary="Logout User"
)
async def logout_user(
    token_data: TokenData = Depends(verify_token)
) -> ApiResponse:
    """
    Logout endpoint.
    Frontend should handle token cleanup (Firebase SDK manages tokens).
    
    **Returns:**
    - Success confirmation
    
    **Note:**
    Firebase tokens are stateless, so logout is mainly frontend-side.
    Backend can optionally revoke refresh tokens or sessions here.
    """
    logger.info(f"User logged out: {token_data.uid}")
    return ApiResponse(
        success=True,
        data={"message": "Logged out successfully"}
    )


# ==================== ROUTES: ORGANIZATION ====================

@app.get(
    "/api/org/{org_id}/info",
    response_model=ApiResponse,
    tags=["Organization"],
    summary="Get Organization Info"
)
async def get_organization_info(
    org_id: str,
    org_access: dict = Depends(verify_organization_access)
) -> ApiResponse:
    """
    Get organization information.
    
    **Parameters:**
    - org_id: Organization ID from URL path
    
    **Headers:**
    - X-Organization-Id: Organization ID (verified against user's org)
    
    **Requirements:**
    - Valid Firebase token
    - User must be member of the specified organization
    
    **Returns:**
    - Organization details
    - User's role in organization
    """
    if org_access['organization_id'] != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization ID mismatch"
        )
    
    return ApiResponse(
        success=True,
        data={
            'organization_id': org_id,
            'user_uid': org_access['user_uid'],
            'message': 'Organization access verified'
        }
    )


@app.get(
    "/api/org/{org_id}/dashboard",
    response_model=ApiResponse,
    tags=["Organization"],
    summary="Get Organization Dashboard"
)
async def get_organization_dashboard(
    org_id: str,
    org_access: dict = Depends(verify_organization_access)
) -> ApiResponse:
    """
    Get organization dashboard data.
    
    **Parameters:**
    - org_id: Organization ID from URL path
    
    **Requirements:**
    - Valid Firebase token
    - User must be member of organization
    
    **Returns:**
    - Dashboard KPIs
    - Recent activity
    - User metrics
    """
    return ApiResponse(
        success=True,
        data={
            'organization_id': org_id,
            'dashboard': {
                'kpis': {
                    'total_users': 0,
                    'active_features': 0,
                    'api_calls_this_month': 0
                },
                'recent_data': [],
                'user_uid': org_access['user_uid']
            }
        }
    )


# ==================== ROUTES: ADMIN ====================

@app.get(
    "/api/admin/users",
    response_model=ApiResponse,
    tags=["Admin"],
    summary="List All Users"
)
async def list_all_users(
    token_data: TokenData = Depends(require_admin)
) -> ApiResponse:
    """
    List all users in the system.
    
    **Requirements:**
    - Valid Firebase token
    - User must have 'admin' role in custom claims
    
    **Returns:**
    - List of all users
    - User count
    - Admin UID
    """
    logger.info(f"Admin user {token_data.uid} accessed user list")
    return ApiResponse(
        success=True,
        data={
            'users': [],
            'total': 0,
            'admin_uid': token_data.uid,
            'note': 'In production, query actual user database'
        }
    )


@app.get(
    "/api/admin/organizations",
    response_model=ApiResponse,
    tags=["Admin"],
    summary="List All Organizations"
)
async def list_all_organizations(
    token_data: TokenData = Depends(require_admin)
) -> ApiResponse:
    """
    List all organizations in the system.
    
    **Requirements:**
    - Valid Firebase token
    - User must have 'admin' role
    
    **Returns:**
    - List of organizations
    - Organization count
    """
    logger.info(f"Admin user {token_data.uid} accessed organization list")
    return ApiResponse(
        success=True,
        data={
            'organizations': [],
            'total': 0,
            'admin_uid': token_data.uid
        }
    )


# ==================== ROUTES: PROTECTED DATA ====================

@app.get(
    "/api/protected-data",
    response_model=ApiResponse,
    tags=["Protected"],
    summary="Get Protected Data"
)
async def get_protected_data(
    user: UserInfo = Depends(get_current_user)
) -> ApiResponse:
    """
    Example protected endpoint requiring authentication.
    
    **Requirements:**
    - Valid Firebase ID token in Authorization header
    
    **Returns:**
    - Message with user's display name
    - Sensitive data visible only to authenticated users
    """
    greeting = f"Hello {user.display_name or user.email}"
    return ApiResponse(
        success=True,
        data={
            'message': greeting,
            'sensitive_data': 'This data is only visible to authenticated users',
            'user_info': {
                'uid': user.uid,
                'email': user.email,
                'verified': user.email_verified
            }
        }
    )


# ==================== ROOT ROUTES ====================

@app.get(
    "/",
    tags=["Root"],
    summary="API Root"
)
async def root():
    """API root endpoint with links to documentation"""
    return {
        "message": "Angular SaaS API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "features": [
            "Firebase JWT Authentication",
            "Multi-tenant Organization Support",
            "Role-Based Access Control",
            "Organization Scoping via Headers"
        ]
    }


# ==================== STARTUP/SHUTDOWN ====================

@app.on_event("startup")
async def startup_event():
    """Additional startup tasks"""
    logger.info("Startup event triggered")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutdown event triggered")


# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Uvicorn server: {host}:{port} (debug={debug})")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level=os.getenv('LOG_LEVEL', 'info').lower()
    )
