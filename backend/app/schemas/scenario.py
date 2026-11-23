from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DisruptionEventBase(BaseModel):
    entity_type: str  # SUPPLIER, FACILITY, CORRIDOR
    entity_id: str
    disruption_type: str  # SHUTDOWN, CAPACITY_REDUCTION, PORT_CLOSURE, LEAD_TIME_SURGE
    start_day: int = 1
    duration_days: int = 14
    capacity_reduction_pct: float = 100.0
    extra_lead_time_days: int = 0
    notes: Optional[str] = None

class DisruptionEventCreate(DisruptionEventBase):
    pass

class DisruptionEventResponse(DisruptionEventBase):
    id: str
    scenario_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None
    horizon_days: int = 60

class ScenarioCreate(ScenarioBase):
    events: List[DisruptionEventCreate] = []

class ScenarioResponse(ScenarioBase):
    id: str
    organization_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    events: List[DisruptionEventResponse] = []

    class Config:
        from_attributes = True

class ScenarioTemplate(BaseModel):
    template_id: str
    name: str
    description: str
    horizon_days: int
    events: List[DisruptionEventBase]
