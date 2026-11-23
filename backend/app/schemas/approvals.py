from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApprovalRequestCreate(BaseModel):
    mitigation_plan_id: str
    scenario_id: Optional[str] = None
    simulation_run_id: Optional[str] = None
    title: str
    recommendation_summary: str

class ApprovalDecisionRequest(BaseModel):
    status: str  # APPROVED, REJECTED, REVISION_REQUESTED
    comments: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: str
    organization_id: str
    mitigation_plan_id: str
    scenario_id: Optional[str]
    simulation_run_id: Optional[str]
    title: str
    recommendation_summary: str
    requested_by_id: str
    requested_by_name: Optional[str]
    reviewed_by_id: Optional[str]
    reviewed_by_name: Optional[str]
    status: str
    comments: Optional[str]
    created_at: datetime
    decided_at: Optional[datetime]

    class Config:
        from_attributes = True
