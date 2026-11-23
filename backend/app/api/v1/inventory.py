from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.supply_network import Inventory, Facility, Material
from app.api.deps import get_current_org_id
from app.schemas.network import InventoryResponse

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryResponse])
def list_inventory(
    facility_id: Optional[str] = None,
    material_id: Optional[str] = None,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    query = db.query(Inventory).filter(Inventory.organization_id == org_id)
    if facility_id:
        query = query.filter(Inventory.facility_id == facility_id)
    if material_id:
        query = query.filter(Inventory.material_id == material_id)
    
    records = query.all()
    fac_map = {f.id: f.name for f in db.query(Facility).filter(Facility.organization_id == org_id).all()}
    mat_map = {m.id: m for m in db.query(Material).filter(Material.organization_id == org_id).all()}

    results = []
    for inv in records:
        mat = mat_map.get(inv.material_id)
        # Approximate days of supply based on average daily consumption (e.g. 50 units/day)
        daily_rate = 50.0
        dos = round(inv.quantity_on_hand / daily_rate, 1)

        results.append(InventoryResponse(
            id=inv.id,
            organization_id=inv.organization_id,
            facility_id=inv.facility_id,
            facility_name=fac_map.get(inv.facility_id, "Unknown Facility"),
            material_id=inv.material_id,
            material_name=mat.name if mat else "Unknown Material",
            material_sku=mat.sku if mat else "Unknown SKU",
            quantity_on_hand=inv.quantity_on_hand,
            safety_stock=inv.safety_stock,
            reorder_point=inv.reorder_point,
            days_of_supply=dos
        ))

    return results
