from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api.v1 import (
    auth, demo_seed, network, suppliers, facilities,
    products, inventory, scenarios, simulations, mitigations,
    agents, approvals, reports, organizations
)
from app.engine.synthetic_generator import ApexSyntheticDataGenerator
from app.models.tenant import Organization
from app.models.user import User, UserRole
from app.services.auth_service import get_password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create database schema
    import app.models
    Base.metadata.create_all(bind=engine)
    
    # 2. Check if default demo data exists; if empty, bootstrap Apex Manufacturing Group
    db = SessionLocal()
    try:
        existing_org = db.query(Organization).first()
        if not existing_org:
            org = Organization(
                name="Apex Manufacturing Group",
                slug="apex-manufacturing",
                industry="Automotive & Industrial Components",
                plan_tier="Enterprise"
            )
            db.add(org)
            db.flush()

            admin_user = User(
                organization_id=org.id,
                email="admin@apex-nexus.com",
                hashed_password=get_password_hash("NexusEnterprise2026!"),
                full_name="Alex Mercer (Chief Supply Chain Officer)",
                role=UserRole.ORG_ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()

            # Seed synthetic supply network
            generator = ApexSyntheticDataGenerator(db, org.id)
            generator.generate_all()
            print("Successfully bootstrapped Apex Manufacturing Group synthetic environment.")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title="NEXUS – AI Supply Network Intelligence & Disruption Simulator",
    description="Enterprise Multi-Tenant B2B SaaS platform for supply network visualization, single-point-of-failure analysis, deterministic discrete-event disruption simulation, mitigation planning, and verifiable LangGraph agent orchestration.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
v1_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=v1_prefix)
app.include_router(demo_seed.router, prefix=v1_prefix)
app.include_router(network.router, prefix=v1_prefix)
app.include_router(suppliers.router, prefix=v1_prefix)
app.include_router(facilities.router, prefix=v1_prefix)
app.include_router(products.router, prefix=v1_prefix)
app.include_router(inventory.router, prefix=v1_prefix)
app.include_router(scenarios.router, prefix=v1_prefix)
app.include_router(simulations.router, prefix=v1_prefix)
app.include_router(mitigations.router, prefix=v1_prefix)
app.include_router(agents.router, prefix=v1_prefix)
app.include_router(approvals.router, prefix=v1_prefix)
app.include_router(reports.router, prefix=v1_prefix)
app.include_router(organizations.router, prefix=v1_prefix)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "platform": "NEXUS Enterprise",
        "engine": "Deterministic Discrete-Time Simulator v2.0",
        "multi_tenant": True
    }

@app.get("/")
def root():
    return {
        "name": "NEXUS – AI Supply Network Intelligence & Disruption Simulator",
        "version": "2.0.0",
        "documentation": "/docs",
        "api_v1": "/api/v1"
    }
