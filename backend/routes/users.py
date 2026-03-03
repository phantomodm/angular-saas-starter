"""
User routes
"""

from fastapi import APIRouter, Depends

from backend.dependencies import get_current_user
from backend.models import UserInfo, ApiResponse

router = APIRouter(prefix="/api/user", tags=["User"])


@router.get("/profile", response_model=ApiResponse)
async def get_profile(
    user: UserInfo = Depends(get_current_user)
) -> ApiResponse:
    """
    Get current authenticated user's profile.
    
    Requirements:
    - Valid Firebase ID token
    
    Returns:
    - User ID
    - Email address
    - Display name
    - Custom claims (role, org_id, permissions)
    """
    return ApiResponse(
        success=True,
        data=user.model_dump()
    )


@router.put("/profile", response_model=ApiResponse)
async def update_profile(
    user: UserInfo = Depends(get_current_user)
) -> ApiResponse:
    """
    Update current user's profile.
    
    Note: Implementation needed - update user in database
    
    Requirements:
    - Valid Firebase ID token
    """
    return ApiResponse(
        success=True,
        data={"message": "Profile update not yet implemented"}
    )
