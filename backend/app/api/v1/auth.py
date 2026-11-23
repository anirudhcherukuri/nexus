from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tenant import Organization
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, Token, UserResponse
from app.services.auth_service import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.api.deps import get_current_user
from app.engine.synthetic_generator import ApexSyntheticDataGenerator
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create Organization
    slug = request.organization_slug or request.organization_name.lower().replace(" ", "-")
    existing_org = db.query(Organization).filter(Organization.slug == slug).first()
    if existing_org:
        slug = f"{slug}-{str(uuid.uuid4())[:4]}"

    org = Organization(
        name=request.organization_name,
        slug=slug,
        industry=request.industry or "Automotive & Industrial Components",
        plan_tier="Enterprise"
    )
    db.add(org)
    db.flush()

    # Create OrgAdmin user
    user = User(
        organization_id=org.id,
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        role=UserRole.ORG_ADMIN,
        is_active=True
    )
    db.add(user)
    db.commit()

    # Automatically seed the rich Apex Manufacturing Group synthetic environment
    generator = ApexSyntheticDataGenerator(db, org.id)
    generator.generate_all()

    AuditService.log(
        db=db,
        organization_id=org.id,
        user_id=user.id,
        user_email=user.email,
        action="ORGANIZATION_REGISTERED",
        entity_type="ORGANIZATION",
        entity_id=org.id,
        details={"org_name": org.name, "seeded": True}
    )

    access_token = create_access_token(data={"sub": user.id, "org_id": org.id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.id, "org_id": org.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 86400
    }

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")

    AuditService.log(
        db=db,
        organization_id=user.organization_id,
        user_id=user.id,
        user_email=user.email,
        action="USER_LOGGED_IN",
        entity_type="USER",
        entity_id=user.id
    )

    access_token = create_access_token(data={"sub": user.id, "org_id": user.organization_id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.id, "org_id": user.organization_id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 86400
    }

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    new_access_token = create_access_token(data={"sub": user.id, "org_id": user.organization_id, "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": user.id, "org_id": user.organization_id})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": 86400
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    return UserResponse(
        id=current_user.id,
        organization_id=current_user.organization_id,
        organization_name=org.name if org else "Apex Manufacturing Group",
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )
