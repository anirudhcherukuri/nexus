from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tenant import Organization
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.api.deps import get_current_org_id, get_current_user, require_roles
from app.schemas.auth import UserResponse
from app.services.auth_service import get_password_hash

router = APIRouter(prefix="/organizations", tags=["Organization & Settings"])

@router.get("/profile")
def get_organization_profile(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    user_count = db.query(User).filter(User.organization_id == org_id).count()
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "industry": org.industry,
        "plan_tier": org.plan_tier,
        "user_count": user_count,
        "created_at": org.created_at
    }

@router.get("/users", response_model=List[UserResponse])
def list_organization_users(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    users = db.query(User).filter(User.organization_id == org_id).all()
    org = db.query(Organization).filter(Organization.id == org_id).first()
    return [
        UserResponse(
            id=u.id,
            organization_id=u.organization_id,
            organization_name=org.name if org else None,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at
        )
        for u in users
    ]

@router.post("/invite")
def invite_user(
    email: str,
    full_name: str,
    role: str = UserRole.OPERATIONS_ANALYST,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    current_user: User = Depends(require_roles([UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN]))
):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        organization_id=org_id,
        email=email,
        hashed_password=get_password_hash("NexusInvite2026!"),
        full_name=full_name,
        role=role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    return {"message": f"User {email} successfully invited with role {role}."}

@router.get("/audit-logs")
def list_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    logs = db.query(AuditLog).filter(AuditLog.organization_id == org_id).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "user_email": l.user_email or "System",
            "details": l.details,
            "timestamp": l.timestamp
        }
        for l in logs
    ]
