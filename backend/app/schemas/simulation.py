from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class SimulationRunRequest(BaseModel):
    scenario_id: str
    name: Optional[str] = None
    seed: Optional[int] = 42

class DailySimulationMetricResponse(BaseModel):
    day: int
    baseline_production: float
    actual_production: float
    units_lost: float
    accumulated_backlog: float
    active_disruptions_count: int
    daily_financial_loss: float
    cumulative_financial_loss: float

    class Config:
        from_attributes = True

class ProductSimulationImpactResponse(BaseModel):
    product_id: str
    product_name: str
    units_demanded: float
    units_produced: float
    units_short: float
    total_revenue_loss: float
    stockout_day: Optional[int] = None

    class Config:
        from_attributes = True

class SimulationRunResponse(BaseModel):
    id: str
    organization_id: str
    scenario_id: str
    name: str
    status: str
    total_revenue_loss: float
    total_units_lost: float
    max_delay_days: int
    stockout_day: Optional[int] = None
    resilience_score: float
    run_summary: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    executed_at: datetime
    daily_metrics: List[DailySimulationMetricResponse] = []
    product_impacts: List[ProductSimulationImpactResponse] = []

    class Config:
        from_attributes = True

class SimulationCompareRequest(BaseModel):
    simulation_ids: List[str]

class ScenarioComparisonMetric(BaseModel):
    simulation_id: str
    scenario_name: str
    total_revenue_loss: float
    total_units_lost: float
    max_delay_days: int
    stockout_day: Optional[int]
    resilience_score: float
    recovery_day: Optional[int]

class SimulationCompareResponse(BaseModel):
    scenarios: List[ScenarioComparisonMetric]
    best_resilience_scenario_id: str
    lowest_cost_scenario_id: str
    key_tradeoffs: List[str]
