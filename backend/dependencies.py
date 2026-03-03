"""
FastAPI dependency injection functions for authentication and authorization
"""

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated, Optional
import os
import logging

from backend.firebase_service import firebase_service
from backend.models import TokenData, UserInfo

logger = logging.getLogger(__name__)

# HTTP Bearer security scheme
security = HTTPBearer(
    description="Firebase JWT token in Authorization header",
    scheme_name="Bearer"
)


# ==================== TOKEN VERIFICATION ====================

async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """
    Dependency to verify Firebase ID token.
    
    Usage in routes:
        @app.get("/protected")
        async def protected_route(token_data: TokenData = Depends(verify_token)):
            return {"user_id": token_data.uid}
    
    Args:
        credentials: Authorization header with Bearer token
        
    Returns:
        TokenData: Decoded token with claims
        
    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    token = credentials.credentials
    
    try:
        decoded_token = firebase_service.verify_token(token)
        return TokenData(**decoded_token)
    except ValueError as e:
        logger.warning(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ==================== USER INFORMATION ====================

async def get_current_user(
    token_data: TokenData = Depends(verify_token)
) -> UserInfo:
    """
    Dependency to get current user information from verified token.
    
    Usage:
        @app.get("/api/profile")
        async def get_profile(user: UserInfo = Depends(get_current_user)):
            return user
    
    Args:
        token_data: Verified token data
        
    Returns:
        UserInfo: User information from Firebase
        
    Raises:
        HTTPException: 401 if user cannot be retrieved
    """
    try:
        user = firebase_service.get_user(token_data.uid)
        return UserInfo(**user)
    except ValueError as e:
        logger.warning(f"Could not retrieve user {token_data.uid}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not retrieve user information"
        )


# ==================== ORGANIZATION ACCESS ====================

async def verify_organization_access(
    token_data: TokenData = Depends(verify_token),
    x_organization_id: Annotated[Optional[str], Header()] = None
) -> dict:
    """
    Dependency to verify user has access to specified organization.
    
    Checks that:
    1. User has organization ID in custom claims
    2. Requested org ID matches user's org ID (if provided in header)
    
    Usage:
        @app.get("/api/org/{org_id}/data")
        async def org_data(org_access: dict = Depends(verify_organization_access)):
            org_id = org_access['organization_id']
            user_uid = org_access['user_uid']
            return {...}
    
    Args:
        token_data: Verified token data
        x_organization_id: Organization ID from X-Organization-Id header
        
    Returns:
        dict: {organization_id, user_uid, token_data}
        
    Raises:
        HTTPException: 403 if user not authorized for org
    """
    # Get organization ID from custom claims
    org_claim_key = os.getenv('ORG_CLAIM_KEY', 'org_id')
    user_org_id = None
    
    if token_data.custom_claims:
        user_org_id = token_data.custom_claims.get(org_claim_key)
    
    if not user_org_id:
        logger.warning(f"User {token_data.uid} has no organization assigned")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any organization"
        )
    
    # Verify requested org matches user's org (if header provided)
    if x_organization_id and x_organization_id != user_org_id:
        logger.warning(
            f"User {token_data.uid} attempted to access unauthorized org {x_organization_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have access to this organization"
        )
    
    return {
        'organization_id': user_org_id,
        'user_uid': token_data.uid,
        'token_data': token_data
    }


# ==================== ROLE-BASED ACCESS ====================

def require_role(*required_roles: str):
    """
    Factory function to create a role-based access control dependency.
    
    Usage:
        @app.delete("/api/users/{user_id}")
        async def delete_user(token_data: TokenData = Depends(require_role("admin"))):
            ...
        
        @app.get("/api/admin/dashboard")
        async def admin_dashboard(token_data: TokenData = Depends(require_role("admin", "owner"))):
            ...
    
    Args:
        required_roles: One or more roles required to access the endpoint
        
    Returns:
        Dependency function that verifies user role
    """
    async def role_checker(
        token_data: TokenData = Depends(verify_token)
    ) -> TokenData:
        role_claim_key = os.getenv('ROLE_CLAIM_KEY', 'role')
        user_role = None
        
        if token_data.custom_claims:
            user_role = token_data.custom_claims.get(role_claim_key)
        
        if user_role not in required_roles:
            logger.warning(
                f"User {token_data.uid} with role '{user_role}' "
                f"attempted to access endpoint requiring roles {required_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {', '.join(required_roles)}"
            )
        
        return token_data
    
    return role_checker


def require_permission(*required_permissions: str):
    """
    Factory function to create a permission-based access control dependency.
    
    Usage:
        @app.post("/api/billing")
        async def manage_billing(
            token_data: TokenData = Depends(require_permission("billing.manage"))
        ):
            ...
    
    Args:
        required_permissions: One or more permissions required
        
    Returns:
        Dependency function that verifies user permissions
    """
    async def permission_checker(
        token_data: TokenData = Depends(verify_token)
    ) -> TokenData:
        user_permissions = []
        
        if token_data.custom_claims:
            user_permissions = token_data.custom_claims.get('permissions', [])
        
        has_permission = any(
            perm in user_permissions for perm in required_permissions
        )
        
        if not has_permission:
            logger.warning(
                f"User {token_data.uid} attempted action requiring "
                f"permissions {required_permissions}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these permissions: "
                       f"{', '.join(required_permissions)}"
            )
        
        return token_data
    
    return permission_checker


# ==================== ADMIN ACCESS ====================

async def require_admin(
    token_data: TokenData = Depends(verify_token)
) -> TokenData:
    """
    Dependency to require admin role.
    Shorthand for require_role("admin").
    
    Usage:
        @app.get("/api/admin/users")
        async def list_users(token_data: TokenData = Depends(require_admin)):
            ...
    """
    admin_checker = require_role("admin")
    return await admin_checker(token_data)


# ==================== KEY DEPENDENCY COMBINATIONS ====================

async def get_org_user(
    org_access: dict = Depends(verify_organization_access),
    user: UserInfo = Depends(get_current_user)
) -> dict:
    """
    Combined dependency for routes that need both org verification and user info.
    
    Usage:
        @app.get("/api/org/{org_id}/profile")
        async def get_org_profile(context: dict = Depends(get_org_user)):
            org_id = context['organization_id']
            user = context['user']
            ...
    """
    return {
        'organization_id': org_access['organization_id'],
        'user_uid': org_access['user_uid'],
        'user': user,
        'token_data': org_access['token_data']
    }


async def get_admin_org_user(
    token_data: TokenData = Depends(require_admin),
    org_access: dict = Depends(verify_organization_access),
    user: UserInfo = Depends(get_current_user)
) -> dict:
    """
    Combined dependency for admin routes within an organization.
    
    Usage:
        @app.delete("/api/org/{org_id}/members/{user_id}")
        async def remove_member(context: dict = Depends(get_admin_org_user)):
            ...
    """
    return {
        'organization_id': org_access['organization_id'],
        'user_uid': org_access['user_uid'],
        'user': user,
        'token_data': token_data
    }
