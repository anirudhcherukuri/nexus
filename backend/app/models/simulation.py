import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_id = Column(String(36), ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="COMPLETED")  # QUEUED, RUNNING, COMPLETED, FAILED
    
    # Core Deterministic KPI summary
    total_revenue_loss = Column(Float, default=0.0)
    total_units_lost = Column(Float, default=0.0)
    max_delay_days = Column(Integer, default=0)
    stockout_day = Column(Integer, nullable=True)
    resilience_score = Column(Float, default=100.0)  # 0 to 100
    
    # Detailed metadata
    run_summary = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow)

    daily_metrics = relationship("DailySimulationMetric", back_populates="simulation_run", cascade="all, delete-orphan")
    product_impacts = relationship("ProductSimulationImpact", back_populates="simulation_run", cascade="all, delete-orphan")

class DailySimulationMetric(Base):
    __tablename__ = "daily_simulation_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    day = Column(Integer, nullable=False)
    baseline_production = Column(Float, default=0.0)
    actual_production = Column(Float, default=0.0)
    units_lost = Column(Float, default=0.0)
    accumulated_backlog = Column(Float, default=0.0)
    active_disruptions_count = Column(Integer, default=0)
    daily_financial_loss = Column(Float, default=0.0)
    cumulative_financial_loss = Column(Float, default=0.0)

    simulation_run = relationship("SimulationRun", back_populates="daily_metrics")

class ProductSimulationImpact(Base):
    __tablename__ = "product_simulation_impacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    units_demanded = Column(Float, default=0.0)
    units_produced = Column(Float, default=0.0)
    units_short = Column(Float, default=0.0)
    total_revenue_loss = Column(Float, default=0.0)
    stockout_day = Column(Integer, nullable=True)

    simulation_run = relationship("SimulationRun", back_populates="product_impacts")
