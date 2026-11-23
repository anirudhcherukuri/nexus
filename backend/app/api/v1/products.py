from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.supply_network import Product, Material, BillOfMaterial
from app.api.deps import get_current_org_id
from app.schemas.network import ProductResponse, MaterialResponse

router = APIRouter(prefix="/products", tags=["Products & Materials"])

@router.get("", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    return db.query(Product).filter(Product.organization_id == org_id).order_by(Product.name.asc()).all()

@router.get("/materials", response_model=List[MaterialResponse])
def list_materials(
    is_critical: Optional[bool] = None,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    query = db.query(Material).filter(Material.organization_id == org_id)
    if is_critical is not None:
        query = query.filter(Material.is_critical == is_critical)
    return query.order_by(Material.name.asc()).all()
