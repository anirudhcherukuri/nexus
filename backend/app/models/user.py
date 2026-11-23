import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole:
    SUPER_ADMIN = "SuperAdmin"
    ORG_ADMIN = "OrgAdmin"
    SUPPLY_CHAIN_MANAGER = "SupplyChainManager"
    PROCUREMENT_MANAGER = "ProcurementManager"
    OPERATIONS_ANALYST = "OperationsAnalyst"
    EXECUTIVE = "Executive"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.SUPPLY_CHAIN_MANAGER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
