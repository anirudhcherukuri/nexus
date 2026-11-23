from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.supply_network import Facility, SupplyEdge, Inventory
from app.api.deps import get_current_org_id, require_roles
from app.models.user import UserRole
from app.schemas.network import FacilityCreate, FacilityResponse

router = APIRouter(prefix="/facilities", tags=["Facilities"])

@router.get("", response_model=List[FacilityResponse])
def list_facilities(
    facility_type: Optional[str] = None,
    operating_status: Optional[str] = None,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    query = db.query(Facility).filter(Facility.organization_id == org_id)
    if facility_type:
        query = query.filter(Facility.facility_type == facility_type)
    if operating_status:
        query = query.filter(Facility.operating_status == operating_status)
    return query.order_by(Facility.name.asc()).all()

@router.post("", response_model=FacilityResponse)
def create_facility(
    payload: FacilityCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    _ = Depends(require_roles([UserRole.ORG_ADMIN, UserRole.SUPPLY_CHAIN_MANAGER]))
):
    fac = Facility(
        organization_id=org_id,
        name=payload.name,
        code=payload.code,
        facility_type=payload.facility_type,
        country=payload.country,
        city=payload.city,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        daily_production_capacity=payload.daily_production_capacity,
        current_utilization=payload.current_utilization,
        operating_status=payload.operating_status,
        is_synthetic=False
    )
    db.add(fac)
    db.commit()
    db.refresh(fac)
    return fac

@router.get("/{facility_id}", response_model=FacilityResponse)
def get_facility_detail(
    facility_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    fac = db.query(Facility).filter(Facility.id == facility_id, Facility.organization_id == org_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")
    return fac
