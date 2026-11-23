import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class DisruptionScenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    horizon_days = Column(Integer, default=60)
    status = Column(String(50), default="DRAFT")  # DRAFT, SIMULATED, ARCHIVED
    created_by_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    events = relationship("DisruptionEvent", back_populates="scenario", cascade="all, delete-orphan")

class DisruptionEvent(Base):
    __tablename__ = "disruption_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id = Column(String(36), ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)  # SUPPLIER, FACILITY, CORRIDOR
    entity_id = Column(String(36), nullable=False, index=True)
    disruption_type = Column(String(50), nullable=False)  # SHUTDOWN, CAPACITY_REDUCTION, PORT_CLOSURE, LEAD_TIME_SURGE
    start_day = Column(Integer, default=1)
    duration_days = Column(Integer, default=14)
    capacity_reduction_pct = Column(Float, default=100.0)  # 0 to 100%
    extra_lead_time_days = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    scenario = relationship("DisruptionScenario", back_populates="events")
