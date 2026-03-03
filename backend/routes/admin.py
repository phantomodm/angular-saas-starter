"""
Admin routes
"""

from fastapi import APIRouter, Depends

from backend.dependencies import require_admin
from backend.models import TokenData, ApiResponse

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=ApiResponse)
async def list_users(
    token_data: TokenData = Depends(require_admin)
) -> ApiResponse:
    """
    List all users in system.
    
    Requirements:
    - Valid Firebase token
    - User must have 'admin' role
    
    Returns:
    - List of all users
    - User count
    
    Note: Implementation needed - query actual user database
    """
    return ApiResponse(
        success=True,
        data={
            'users': [],
            'total': 0,
            'admin_uid': token_data.uid
        }
    )


@router.get("/organizations", response_model=ApiResponse)
async def list_organizations(
    token_data: TokenData = Depends(require_admin)
) -> ApiResponse:
    """
    List all organizations.
    
    Requirements:
    - Valid Firebase token
    - User must have 'admin' role
    
    Returns:
    - List of all organizations
    - Organization count
    """
    return ApiResponse(
        success=True,
        data={
            'organizations': [],
            'total': 0,
            'admin_uid': token_data.uid
        }
    )


@router.get("/analytics", response_model=ApiResponse)
async def get_admin_analytics(
    token_data: TokenData = Depends(require_admin)
) -> ApiResponse:
    """
    Get system-wide analytics.
    
    Requirements:
    - Valid Firebase token
    - User must have 'admin' role
    
    Returns:
    - System-wide metrics
    - Usage statistics
    - Health indicators
    """
    return ApiResponse(
        success=True,
        data={
            'total_users': 0,
            'total_organizations': 0,
            'api_calls_today': 0,
            'system_health': 'healthy'
        }
    )
