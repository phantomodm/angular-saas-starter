"""
Teams Routes
Handles team management, team members, invitations, and team operations
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import logging

from ..models import ApiResponse, User
from ..dependencies import get_current_user
from ..database import get_firestore_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/teams", tags=["teams"])


# Pydantic models
class CreateTeamRequest(BaseModel):
    name: str
    description: Optional[str] = None


class UpdateTeamRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class AddMemberRequest(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None
    role: str = "member"  # member, admin


class UpdateMemberRoleRequest(BaseModel):
    role: str  # member, admin, owner


class InviteResponse(BaseModel):
    id: str
    team_id: str
    email: str
    role: str
    status: str = "pending"
    invited_at: datetime


# Team endpoints
@router.post("/", response_model=ApiResponse)
async def create_team(
    organization_id: str = Query(...),
    request: CreateTeamRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Create a new team in organization"""
    try:
        firestore_db = get_firestore_db()
        
        # Verify org exists
        org_doc = firestore_db.collection('organizations').document(organization_id).get()
        if not org_doc.exists:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Create team document
        team_data = {
            "name": request.name,
            "description": request.description or "",
            "organization_id": organization_id,
            "owner_id": current_user.id,
            "member_count": 1,
            "created_by": current_user.id,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        
        team_ref = firestore_db.collection('teams').document()
        team_ref.set(team_data)
        
        # Add owner to team
        member_data = {
            "user_id": current_user.id,
            "team_id": team_ref.id,
            "organization_id": organization_id,
            "name": current_user.display_name,
            "email": current_user.email,
            "role": "owner",
            "joined_at": datetime.now(),
        }
        firestore_db.collection('team_members').document(f"{team_ref.id}_{current_user.id}").set(member_data)
        
        logger.info(f"Created team {team_ref.id} in org {organization_id}")
        
        return ApiResponse(
            success=True,
            data={
                "team": {
                    "id": team_ref.id,
                    "name": request.name,
                    "description": request.description or "",
                    "organization_id": organization_id,
                    "owner_id": current_user.id,
                    "member_count": 1,
                    "created_at": datetime.now(),
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create team: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{team_id}", response_model=ApiResponse)
async def get_team(
    team_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get team details"""
    try:
        firestore_db = get_firestore_db()
        
        team_doc = firestore_db.collection('teams').document(team_id).get()
        if not team_doc.exists:
            raise HTTPException(status_code=404, detail="Team not found")
        
        team_data = team_doc.to_dict()
        
        return ApiResponse(
            success=True,
            data={
                "team": {
                    "id": team_id,
                    "name": team_data.get('name'),
                    "description": team_data.get('description', ''),
                    "organization_id": team_data.get('organization_id'),
                    "owner_id": team_data.get('owner_id'),
                    "member_count": team_data.get('member_count', 0),
                    "created_at": team_data.get('created_at'),
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get team: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{team_id}", response_model=ApiResponse)
async def update_team(
    team_id: str,
    request: UpdateTeamRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Update team details"""
    try:
        firestore_db = get_firestore_db()
        
        team_doc = firestore_db.collection('teams').document(team_id).get()
        if not team_doc.exists:
            raise HTTPException(status_code=404, detail="Team not found")
        
        team_data = team_doc.to_dict()
        
        # Check authorization (owner or admin)
        if current_user.id != team_data.get('owner_id'):
            raise HTTPException(status_code=403, detail="Not authorized to update team")
        
        update_data = {
            "updated_at": datetime.now(),
        }
        if request.name:
            update_data["name"] = request.name
        if request.description is not None:
            update_data["description"] = request.description
        
        firestore_db.collection('teams').document(team_id).update(update_data)
        
        logger.info(f"Updated team {team_id}")
        
        return ApiResponse(
            success=True,
            data={
                "team": {
                    "id": team_id,
                    "name": request.name or team_data.get('name'),
                    "description": request.description if request.description is not None else team_data.get('description', ''),
                    "organization_id": team_data.get('organization_id'),
                    "owner_id": team_data.get('owner_id'),
                    "member_count": team_data.get('member_count', 0),
                    "created_at": team_data.get('created_at'),
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update team: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{team_id}", response_model=ApiResponse)
async def delete_team(
    team_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete team"""
    try:
        firestore_db = get_firestore_db()
        
        team_doc = firestore_db.collection('teams').document(team_id).get()
        if not team_doc.exists:
            raise HTTPException(status_code=404, detail="Team not found")
        
        team_data = team_doc.to_dict()
        
        # Check authorization (owner only)
        if current_user.id != team_data.get('owner_id'):
            raise HTTPException(status_code=403, detail="Only team owner can delete team")
        
        # Delete team members
        members = firestore_db.collection('team_members').where('team_id', '==', team_id).stream()
        for member_doc in members:
            member_doc.reference.delete()
        
        # Delete team
        firestore_db.collection('teams').document(team_id).delete()
        
        logger.info(f"Deleted team {team_id}")
        
        return ApiResponse(
            success=True,
            data={"message": "Team deleted"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete team: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Team Members endpoints
@router.get("/{team_id}/members", response_model=ApiResponse)
async def get_team_members(
    team_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get team members"""
    try:
        firestore_db = get_firestore_db()
        
        # Verify team exists
        team_doc = firestore_db.collection('teams').document(team_id).get()
        if not team_doc.exists:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Get members
        members = firestore_db.collection('team_members').where('team_id', '==', team_id).stream()
        
        member_list = []
        for member_doc in members:
            member_data = member_doc.to_dict()
            member_list.append({
                "id": member_doc.id,
                "user_id": member_data.get('user_id'),
                "name": member_data.get('name'),
                "email": member_data.get('email'),
                "role": member_data.get('role'),
                "joined_at": member_data.get('joined_at'),
            })
        
        return ApiResponse(
            success=True,
            data={
                "members": sorted(member_list, key=lambda x: x['joined_at'], reverse=True)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get team members: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{team_id}/members", response_model=ApiResponse)
async def add_team_member(
    team_id: str,
    request: AddMemberRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Add member to team (with invitation)"""
    try:
        firestore_db = get_firestore_db()
        
        # Verify team exists and current user is team admin/owner
        team_doc = firestore_db.collection('teams').document(team_id).get()
        if not team_doc.exists:
            raise HTTPException(status_code=404, detail="Team not found")
        
        team_data = team_doc.to_dict()
        
        # Check authorization
        member_doc = firestore_db.collection('team_members').document(f"{team_id}_{current_user.id}").get()
        if not member_doc.exists:
            raise HTTPException(status_code=403, detail="Not a team member")
        
        member_role = member_doc.to_dict().get('role')
        if member_role not in ['admin', 'owner']:
            raise HTTPException(status_code=403, detail="Not authorized to add members")
        
        # Check if member already exists
        existing = firestore_db.collection('team_members').where('team_id', '==', team_id).where('email', '==', request.email).stream()
        if list(existing):
            raise HTTPException(status_code=400, detail="Member already in team")
        
        # Create team member record or invitation
        member_data = {
            "email": request.email,
            "display_name": request.display_name or request.email.split('@')[0],
            "team_id": team_id,
            "organization_id": team_data.get('organization_id'),
            "role": request.role,
            "status": "invited",
            "invited_by": current_user.id,
            "invited_at": datetime.now(),
            "joined_at": None,
        }
        
        invite_ref = firestore_db.collection('team_invitations').document()
        invite_ref.set(member_data)
        
        # TODO: Send email invitation
        
        logger.info(f"Invited {request.email} to team {team_id}")
        
        return ApiResponse(
            success=True,
            data={
                "invitation": {
                    "id": invite_ref.id,
                    "email": request.email,
                    "team_id": team_id,
                    "role": request.role,
                    "status": "invited",
                    "invited_at": datetime.now(),
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add team member: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{team_id}/members/{member_id}", response_model=ApiResponse)
async def update_team_member_role(
    team_id: str,
    member_id: str,
    request: UpdateMemberRoleRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Update team member role"""
    try:
        firestore_db = get_firestore_db()
        
        # Verify team exists
        team_doc = firestore_db.collection('teams').document(team_id).get()
        if not team_doc.exists:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check authorization (owner/admin only)
        member_doc = firestore_db.collection('team_members').document(f"{team_id}_{current_user.id}").get()
        if not member_doc.exists:
            raise HTTPException(status_code=403, detail="Not a team member")
        
        member_role = member_doc.to_dict().get('role')
        if member_role not in ['admin', 'owner']:
            raise HTTPException(status_code=403, detail="Not authorized to update roles")
        
        # Update member role
        target_member_doc = firestore_db.collection('team_members').document(f"{team_id}_{member_id}").get()
        if not target_member_doc.exists:
            raise HTTPException(status_code=404, detail="Team member not found")
        
        target_data = target_member_doc.to_dict()
        firestore_db.collection('team_members').document(f"{team_id}_{member_id}").update({
            "role": request.role,
            "updated_at": datetime.now(),
        })
        
        logger.info(f"Updated {member_id} role in team {team_id} to {request.role}")
        
        return ApiResponse(
            success=True,
            data={
                "member": {
                    "id": f"{team_id}_{member_id}",
                    "user_id": member_id,
                    "name": target_data.get('name'),
                    "email": target_data.get('email'),
                    "role": request.role,
                    "joined_at": target_data.get('joined_at'),
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update team member: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{team_id}/members/{member_id}", response_model=ApiResponse)
async def remove_team_member(
    team_id: str,
    member_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove member from team"""
    try:
        firestore_db = get_firestore_db()
        
        # Verify team exists
        team_doc = firestore_db.collection('teams').document(team_id).get()
        if not team_doc.exists:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check authorization (owner/admin)
        auth_member_doc = firestore_db.collection('team_members').document(f"{team_id}_{current_user.id}").get()
        if not auth_member_doc.exists:
            raise HTTPException(status_code=403, detail="Not a team member")
        
        auth_role = auth_member_doc.to_dict().get('role')
        if auth_role not in ['admin', 'owner']:
            raise HTTPException(status_code=403, detail="Not authorized to remove members")
        
        # Verify member exists
        target_member_doc = firestore_db.collection('team_members').document(f"{team_id}_{member_id}").get()
        if not target_member_doc.exists:
            raise HTTPException(status_code=404, detail="Team member not found")
        
        # Can't remove owner
        target_role = target_member_doc.to_dict().get('role')
        if target_role == 'owner':
            raise HTTPException(status_code=400, detail="Cannot remove team owner")
        
        # Remove member
        firestore_db.collection('team_members').document(f"{team_id}_{member_id}").delete()
        
        # Update member count
        team_data = team_doc.to_dict()
        new_count = max(0, team_data.get('member_count', 1) - 1)
        firestore_db.collection('teams').document(team_id).update({
            "member_count": new_count,
        })
        
        logger.info(f"Removed {member_id} from team {team_id}")
        
        return ApiResponse(
            success=True,
            data={"message": "Member removed from team"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove team member: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
