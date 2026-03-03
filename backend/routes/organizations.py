"""
Organization routes
"""

from fastapi import APIRouter, Depends

from backend.dependencies import verify_organization_access, get_org_user
from backend.models import ApiResponse

router = APIRouter(prefix="/api/org", tags=["Organization"])


@router.get("/{org_id}/info", response_model=ApiResponse)
async def get_org_info(
    org_id: str,
    org_access: dict = Depends(verify_organization_access)
) -> ApiResponse:
    """
    Get organization information.
    
    Requirements:
    - Valid Firebase token
    - User must be member of organization
    - X-Organization-Id header must match user's org
    
    Returns:
    - Organization ID
    - User's role in organization
    """
    return ApiResponse(
        success=True,
        data={
            'organization_id': org_access['organization_id'],
            'user_uid': org_access['user_uid'],
            'status': 'verified'
        }
    )


@router.get("/{org_id}/dashboard", response_model=ApiResponse)
async def get_org_dashboard(
    org_id: str,
    org_access: dict = Depends(verify_organization_access)
) -> ApiResponse:
    """
    Get organization dashboard data.
    
    Requirements:
    - Valid Firebase token
    - User must be member of organization
    
    Returns:
    - Dashboard KPIs
    - Recent activity
    - Usage metrics
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
                'recent_data': []
            }
        }
    )


@router.get("/{org_id}/members", response_model=ApiResponse)
async def get_org_members(
    org_id: str,
    context: dict = Depends(get_org_user)
) -> ApiResponse:
    """
    Get organization members.
    
    Requirements:
    - Valid Firebase token
    - User must be member of organization
    
    Returns:
    - List of organization members
    - Each member's role and status
    """
    return ApiResponse(
        success=True,
        data={
            'organization_id': org_id,
            'members': [],
            'total': 0
        }
    )
