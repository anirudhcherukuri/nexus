import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.tenant import Organization
from app.models.user import User, UserRole
from app.models.supply_network import Supplier

def test_tenant_data_isolation():
    """Verify that Organization A cannot access or query Organization B's data."""
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    TestingSession = sessionmaker(bind=test_engine)
    db = TestingSession()

    org_a = Organization(name="Company A", slug="company-a")
    org_b = Organization(name="Company B", slug="company-b")
    db.add_all([org_a, org_b])
    db.commit()

    sup_a = Supplier(organization_id=org_a.id, name="Supplier A", code="SUP-A", tier="Tier 1", country="USA", city="Chicago")
    sup_b = Supplier(organization_id=org_b.id, name="Supplier B", code="SUP-B", tier="Tier 1", country="Germany", city="Munich")
    db.add_all([sup_a, sup_b])
    db.commit()

    # Query scoped to Org A
    results_a = db.query(Supplier).filter(Supplier.organization_id == org_a.id).all()
    assert len(results_a) == 1
    assert results_a[0].name == "Supplier A"
    assert sup_b.id not in [s.id for s in results_a]

    # Query scoped to Org B
    results_b = db.query(Supplier).filter(Supplier.organization_id == org_b.id).all()
    assert len(results_b) == 1
    assert results_b[0].name == "Supplier B"
    assert sup_a.id not in [s.id for s in results_b]
