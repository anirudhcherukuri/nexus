from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    code: str
    tier: str
    country: str
    city: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    daily_capacity: float = 1000.0
    current_utilization: float = 75.0
    lead_time_days: int = 7
    unit_cost: float = 50.0
    reliability_score: float = 0.95
    financial_risk: float = 0.2
    operational_risk: float = 0.2
    status: str = "ACTIVE"
    is_synthetic: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    tier: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    daily_capacity: Optional[float] = None
    current_utilization: Optional[float] = None
    lead_time_days: Optional[int] = None
    unit_cost: Optional[float] = None
    reliability_score: Optional[float] = None
    financial_risk: Optional[float] = None
    operational_risk: Optional[float] = None
    status: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: str
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class FacilityBase(BaseModel):
    name: str
    code: str
    facility_type: str
    country: str
    city: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    daily_production_capacity: float = 500.0
    current_utilization: float = 80.0
    operating_status: str = "NORMAL"
    is_synthetic: bool = True

class FacilityCreate(FacilityBase):
    pass

class FacilityResponse(FacilityBase):
    id: str
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class MaterialResponse(BaseModel):
    id: str
    organization_id: str
    sku: str
    name: str
    category: str
    standard_cost: float
    unit_of_measure: str
    is_critical: bool

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: str
    organization_id: str
    sku: str
    name: str
    description: Optional[str] = None
    selling_price: float
    target_daily_demand: float

    class Config:
        from_attributes = True

class InventoryResponse(BaseModel):
    id: str
    organization_id: str
    facility_id: str
    facility_name: Optional[str] = None
    material_id: str
    material_name: Optional[str] = None
    material_sku: Optional[str] = None
    quantity_on_hand: float
    safety_stock: float
    reorder_point: float
    days_of_supply: Optional[float] = 0.0

    class Config:
        from_attributes = True

class SupplyEdgeResponse(BaseModel):
    id: str
    source_type: str
    source_id: str
    source_name: Optional[str] = None
    target_type: str
    target_id: str
    target_name: Optional[str] = None
    material_id: Optional[str] = None
    material_name: Optional[str] = None
    daily_supply_quantity: float
    lead_time_days: int
    transit_cost_per_unit: float
    dependency_percentage: float

    class Config:
        from_attributes = True

class NetworkGraphNode(BaseModel):
    id: str
    label: str
    node_type: str  # SUPPLIER_T3, SUPPLIER_T2, SUPPLIER_T1, FACILITY, WAREHOUSE, CUSTOMER
    tier: Optional[str] = None
    location: str
    capacity: float
    utilization: float
    risk_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    status: str
    is_spof: bool = False
    betweenness_centrality: float = 0.0
    position: Dict[str, float] = {"x": 0, "y": 0}
    details: Dict[str, Any] = {}

class NetworkGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    material: Optional[str] = None
    quantity: float
    lead_time: int
    unit_cost: float
    dependency_percentage: float
    is_critical_path: bool = False

class NetworkGraphResponse(BaseModel):
    nodes: List[NetworkGraphNode]
    edges: List[NetworkGraphEdge]
    total_nodes: int
    total_edges: int
    spof_count: int
    tier_counts: Dict[str, int]

class CriticalSupplierReport(BaseModel):
    supplier_id: str
    name: str
    tier: str
    country: str
    downstream_impact_count: int
    dependent_facilities: List[str]
    betweenness_centrality: float
    risk_score: float
    is_spof: bool
    supplied_materials: List[str]
