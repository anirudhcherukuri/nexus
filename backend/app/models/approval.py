import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from app.database import Base

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    mitigation_plan_id = Column(String(36), ForeignKey("mitigation_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_id = Column(String(36), nullable=True)
    simulation_run_id = Column(String(36), nullable=True)
    
    title = Column(String(255), nullable=False)
    recommendation_summary = Column(Text, nullable=False)
    requested_by_id = Column(String(36), nullable=False)
    requested_by_name = Column(String(255), nullable=True)
    reviewed_by_id = Column(String(36), nullable=True)
    reviewed_by_name = Column(String(255), nullable=True)
    
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, REVISION_REQUESTED
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)
