from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.approval import ApprovalRequest
from app.models.mitigation import MitigationPlan
from app.api.deps import get_current_org_id, get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.approvals import ApprovalRequestCreate, ApprovalDecisionRequest, ApprovalResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/approvals", tags=["Human Approvals"])

@router.get("", response_model=List[ApprovalResponse])
def list_approvals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    query = db.query(ApprovalRequest).filter(ApprovalRequest.organization_id == org_id)
    if status:
        query = query.filter(ApprovalRequest.status == status)
    return query.order_by(ApprovalRequest.created_at.desc()).all()

@router.post("", response_model=ApprovalResponse)
def create_approval_request(
    payload: ApprovalRequestCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(MitigationPlan).filter(
        MitigationPlan.id == payload.mitigation_plan_id,
        MitigationPlan.organization_id == org_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Mitigation plan not found")

    req = ApprovalRequest(
        organization_id=org_id,
        mitigation_plan_id=plan.id,
        scenario_id=payload.scenario_id,
        simulation_run_id=payload.simulation_run_id or plan.simulation_run_id,
        title=payload.title,
        recommendation_summary=payload.recommendation_summary,
        requested_by_id=current_user.id,
        requested_by_name=current_user.full_name,
        status="PENDING"
    )
    db.add(req)
    plan.status = "SUBMITTED_FOR_APPROVAL"
    db.commit()
    db.refresh(req)

    AuditService.log(
        db=db,
        organization_id=org_id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="APPROVAL_REQUESTED",
        entity_type="APPROVAL",
        entity_id=req.id,
        details={"plan_id": plan.id, "title": req.title}
    )

    return req

@router.post("/{approval_id}/decide", response_model=ApprovalResponse)
def decide_approval(
    approval_id: str,
    payload: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    current_user: User = Depends(require_roles([UserRole.ORG_ADMIN, UserRole.SUPPLY_CHAIN_MANAGER, UserRole.EXECUTIVE]))
):
    req = db.query(ApprovalRequest).filter(
        ApprovalRequest.id == approval_id,
        ApprovalRequest.organization_id == org_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")

    valid_statuses = ["APPROVED", "REJECTED", "REVISION_REQUESTED"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    req.status = payload.status
    req.comments = payload.comments
    req.reviewed_by_id = current_user.id
    req.reviewed_by_name = current_user.full_name
    req.decided_at = datetime.utcnow()

    # Update associated mitigation plan
    plan = db.query(MitigationPlan).filter(MitigationPlan.id == req.mitigation_plan_id).first()
    if plan:
        plan.status = payload.status

    db.commit()
    db.refresh(req)

    AuditService.log(
        db=db,
        organization_id=org_id,
        user_id=current_user.id,
        user_email=current_user.email,
        action=f"APPROVAL_{payload.status}",
        entity_type="APPROVAL",
        entity_id=req.id,
        details={"comments": payload.comments, "plan_id": req.mitigation_plan_id}
    )

    return req
