"""
Authentication routes
"""

from fastapi import APIRouter, Depends, status, HTTPException
from datetime import datetime

from backend.dependencies import verify_token
from backend.models import TokenData, ApiResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/verify-token", response_model=ApiResponse)
async def verify_token_endpoint(
    token_data: TokenData = Depends(verify_token)
) -> ApiResponse:
    """
    Verify Firebase token and return decoded claims.
    
    Used for validating tokens on backend and debugging.
    """
    return ApiResponse(
        success=True,
        data={
            'uid': token_data.uid,
            'email': token_data.email,
            'email_verified': token_data.email_verified,
            'custom_claims': token_data.custom_claims,
            'issued_at': datetime.fromtimestamp(token_data.iat),
            'expires_at': datetime.fromtimestamp(token_data.exp)
        }
    )


@router.post("/logout", response_model=ApiResponse)
async def logout(
    token_data: TokenData = Depends(verify_token)
) -> ApiResponse:
    """
    Logout user.
    
    Firebase tokens are stateless, so logout is mainly frontend cleanup.
    Backend can optionally revoke sessions/refresh tokens here.
    """
    return ApiResponse(
        success=True,
        data={"message": "Logged out successfully"}
    )
