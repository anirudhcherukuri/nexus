import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    tier = Column(String(20), nullable=False)  # Tier 1, Tier 2, Tier 3
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    daily_capacity = Column(Float, default=1000.0)
    current_utilization = Column(Float, default=75.0)  # Percentage 0-100
    lead_time_days = Column(Integer, default=7)
    unit_cost = Column(Float, default=50.0)
    reliability_score = Column(Float, default=0.95)   # 0.0 - 1.0
    financial_risk = Column(Float, default=0.2)      # 0.0 - 1.0
    operational_risk = Column(Float, default=0.2)    # 0.0 - 1.0
    status = Column(String(50), default="ACTIVE")    # ACTIVE, DISRUPTED, RESTRICTED
    is_synthetic = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    facility_type = Column(String(50), nullable=False)  # PLANT, WAREHOUSE, DISTRIBUTION_CENTER, LOGISTICS_HUB
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    daily_production_capacity = Column(Float, default=500.0)
    current_utilization = Column(Float, default=80.0)
    operating_status = Column(String(50), default="NORMAL")  # NORMAL, DEGRADED, SHUTDOWN
    is_synthetic = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Material(Base):
    __tablename__ = "materials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    sku = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Raw Material")
    standard_cost = Column(Float, default=25.0)
    unit_of_measure = Column(String(20), default="pcs")
    is_critical = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    sku = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    selling_price = Column(Float, default=500.0)
    target_daily_demand = Column(Float, default=100.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class BillOfMaterial(Base):
    __tablename__ = "bill_of_materials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity_required = Column(Float, default=1.0)

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    facility_id = Column(String(36), ForeignKey("facilities.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity_on_hand = Column(Float, default=1000.0)
    safety_stock = Column(Float, default=200.0)
    reorder_point = Column(Float, default=400.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SupplyEdge(Base):
    __tablename__ = "supply_edges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)  # SUPPLIER, FACILITY
    source_id = Column(String(36), nullable=False, index=True)
    target_type = Column(String(50), nullable=False)  # SUPPLIER, FACILITY, CUSTOMER
    target_id = Column(String(36), nullable=False, index=True)
    material_id = Column(String(36), ForeignKey("materials.id", ondelete="SET NULL"), nullable=True)
    daily_supply_quantity = Column(Float, default=100.0)
    lead_time_days = Column(Integer, default=5)
    transit_cost_per_unit = Column(Float, default=2.5)
    dependency_percentage = Column(Float, default=100.0)  # 0 - 100%
    created_at = Column(DateTime, default=datetime.utcnow)
