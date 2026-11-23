import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON
from app.database import Base

class MitigationPlan(Base):
    __tablename__ = "mitigation_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    simulation_run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    strategy_name = Column(String(255), nullable=False)
    strategy_type = Column(String(100), default="ALTERNATIVE_SOURCING") # ALTERNATIVE_SOURCING, BUFFER_EXPEDITE, LOAD_SHIFTING, MULTI_STRATEGY
    description = Column(Text, nullable=True)
    
    # Financial and operational metrics
    additional_procurement_cost = Column(Float, default=0.0)
    additional_logistics_cost = Column(Float, default=0.0)
    units_recovered = Column(Float, default=0.0)
    avoided_revenue_loss = Column(Float, default=0.0)
    net_financial_benefit = Column(Float, default=0.0)
    recovery_days_saved = Column(Integer, default=0)
    feasibility_score = Column(Float, default=95.0) # 0 - 100
    status = Column(String(50), default="DRAFT") # DRAFT, SUBMITTED_FOR_APPROVAL, APPROVED, REJECTED
    
    parameters_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
