from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tenant import Organization
from app.models.user import User, UserRole
from app.api.deps import get_current_user, get_current_org_id
from app.engine.synthetic_generator import ApexSyntheticDataGenerator
from app.services.auth_service import get_password_hash

router = APIRouter(prefix="/demo", tags=["Demo Environment"])

@router.post("/seed")
def seed_demo_environment(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    """Resets and regenerates the full Apex Manufacturing Group synthetic supply network."""
    generator = ApexSyntheticDataGenerator(db, org_id)
    summary = generator.generate_all()
    return {
        "message": "Apex Manufacturing Group synthetic supply chain successfully seeded.",
        "summary": summary
    }

@router.post("/quick-start")
def quick_start_init(db: Session = Depends(get_db)):
    """Zero-setup bootstrap endpoint: ensures a default demo organization and user exist, and seeds data."""
    # Check if default demo org exists
    org = db.query(Organization).filter(Organization.slug == "apex-manufacturing").first()
    if not org:
        org = Organization(
            name="Apex Manufacturing Group",
            slug="apex-manufacturing",
            industry="Automotive & Industrial Components",
            plan_tier="Enterprise"
        )
        db.add(org)
        db.flush()

    # Check if demo user exists
    user = db.query(User).filter(User.email == "executive@apex-nexus.com").first()
    if not user:
        user = User(
            organization_id=org.id,
            email="executive@apex-nexus.com",
            hashed_password=get_password_hash("NexusEnterprise2026!"),
            full_name="Sarah Jenkins (VP Supply Chain)",
            role=UserRole.SUPPLY_CHAIN_MANAGER,
            is_active=True
        )
        db.add(user)
        db.commit()

    generator = ApexSyntheticDataGenerator(db, org.id)
    summary = generator.generate_all()

    return {
        "organization_id": org.id,
        "default_credentials": {
            "email": "executive@apex-nexus.com",
            "password": "NexusEnterprise2026!"
        },
        "summary": summary
    }
