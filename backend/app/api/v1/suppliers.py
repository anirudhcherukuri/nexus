import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.supply_network import Supplier, SupplyEdge, Material
from app.api.deps import get_current_org_id, require_roles
from app.models.user import UserRole
from app.schemas.network import SupplierCreate, SupplierUpdate, SupplierResponse

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierResponse])
def list_suppliers(
    tier: Optional[str] = None,
    country: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    query = db.query(Supplier).filter(Supplier.organization_id == org_id)
    if tier:
        query = query.filter(Supplier.tier == tier)
    if country:
        query = query.filter(Supplier.country == country)
    if status:
        query = query.filter(Supplier.status == status)
    if search:
        query = query.filter(
            (Supplier.name.ilike(f"%{search}%")) |
            (Supplier.code.ilike(f"%{search}%")) |
            (Supplier.city.ilike(f"%{search}%"))
        )
    return query.order_by(Supplier.name.asc()).all()

@router.post("", response_model=SupplierResponse)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    _ = Depends(require_roles([UserRole.ORG_ADMIN, UserRole.SUPPLY_CHAIN_MANAGER, UserRole.PROCUREMENT_MANAGER]))
):
    sup = Supplier(
        organization_id=org_id,
        name=payload.name,
        code=payload.code,
        tier=payload.tier,
        country=payload.country,
        city=payload.city,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        daily_capacity=payload.daily_capacity,
        current_utilization=payload.current_utilization,
        lead_time_days=payload.lead_time_days,
        unit_cost=payload.unit_cost,
        reliability_score=payload.reliability_score,
        financial_risk=payload.financial_risk,
        operational_risk=payload.operational_risk,
        status=payload.status,
        is_synthetic=False
    )
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier_detail(
    supplier_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    sup = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.organization_id == org_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return sup

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: str,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    _ = Depends(require_roles([UserRole.ORG_ADMIN, UserRole.SUPPLY_CHAIN_MANAGER, UserRole.PROCUREMENT_MANAGER]))
):
    sup = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.organization_id == org_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(sup, field, val)

    db.commit()
    db.refresh(sup)
    return sup

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    _ = Depends(require_roles([UserRole.ORG_ADMIN, UserRole.SUPPLY_CHAIN_MANAGER]))
):
    sup = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.organization_id == org_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Delete associated edges
    db.query(SupplyEdge).filter(
        (SupplyEdge.source_id == supplier_id) | (SupplyEdge.target_id == supplier_id),
        SupplyEdge.organization_id == org_id
    ).delete()

    db.delete(sup)
    db.commit()
    return {"message": f"Supplier '{sup.name}' deleted successfully."}

@router.get("/export/csv")
def export_suppliers_csv(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    suppliers = db.query(Supplier).filter(Supplier.organization_id == org_id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Code", "Name", "Tier", "Country", "City", "DailyCapacity", "UtilizationPct", "LeadTimeDays", "UnitCost", "Reliability", "Status"])
    for s in suppliers:
        writer.writerow([s.code, s.name, s.tier, s.country, s.city, s.daily_capacity, s.current_utilization, s.lead_time_days, s.unit_cost, s.reliability_score, s.status])
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nexus_suppliers_export.csv"}
    )

@router.post("/import/csv")
async def import_suppliers_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    _ = Depends(require_roles([UserRole.ORG_ADMIN, UserRole.SUPPLY_CHAIN_MANAGER]))
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    imported = 0
    for row in reader:
        sup = Supplier(
            organization_id=org_id,
            name=row.get("Name", "New Supplier"),
            code=row.get("Code", f"SUP-{imported+1}"),
            tier=row.get("Tier", "Tier 2"),
            country=row.get("Country", "USA"),
            city=row.get("City", "Dallas"),
            daily_capacity=float(row.get("DailyCapacity", 1000.0)),
            current_utilization=float(row.get("UtilizationPct", 75.0)),
            lead_time_days=int(row.get("LeadTimeDays", 7)),
            unit_cost=float(row.get("UnitCost", 50.0)),
            reliability_score=float(row.get("Reliability", 0.95)),
            status=row.get("Status", "ACTIVE"),
            is_synthetic=False
        )
        db.add(sup)
        imported += 1
    db.commit()
    return {"message": f"Successfully imported {imported} suppliers from CSV."}
