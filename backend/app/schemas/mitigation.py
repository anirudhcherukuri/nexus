from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class MitigationOptimizeRequest(BaseModel):
    simulation_run_id: str
    optimization_objective: str = "BALANCED"  # MIN_COST, MIN_DELAY, MAX_RECOVERY, BALANCED
    max_budget: Optional[float] = None
    allow_expedited_freight: bool = True
    allow_secondary_suppliers: bool = True

class MitigationStrategyCard(BaseModel):
    id: str
    name: str
    strategy_type: str
    additional_cost: float
    units_recovered: float
    avoided_loss: float
    net_benefit: float
    recovery_days_saved: int
    feasibility_score: float
    details: Dict[str, Any]

class MitigationPlanResponse(BaseModel):
    id: str
    simulation_run_id: str
    strategy_name: str
    strategy_type: str
    description: Optional[str] = None
    additional_procurement_cost: float
    additional_logistics_cost: float
    units_recovered: float
    avoided_revenue_loss: float
    net_financial_benefit: float
    recovery_days_saved: int
    feasibility_score: float
    status: str
    parameters_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
