from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scenario import DisruptionScenario, DisruptionEvent
from app.models.supply_network import Supplier, Facility
from app.api.deps import get_current_org_id, get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.scenario import (
    ScenarioCreate, ScenarioResponse, DisruptionEventCreate, DisruptionEventResponse, ScenarioTemplate
)

router = APIRouter(prefix="/scenarios", tags=["Disruption Scenarios"])

@router.get("", response_model=List[ScenarioResponse])
def list_scenarios(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    scenarios = db.query(DisruptionScenario).filter(DisruptionScenario.organization_id == org_id).order_by(DisruptionScenario.created_at.desc()).all()
    return scenarios

@router.post("", response_model=ScenarioResponse)
def create_scenario(
    payload: ScenarioCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user)
):
    scen = DisruptionScenario(
        organization_id=org_id,
        name=payload.name,
        description=payload.description,
        horizon_days=payload.horizon_days,
        status="DRAFT",
        created_by_id=current_user.id
    )
    db.add(scen)
    db.flush()

    for ev in payload.events:
        event = DisruptionEvent(
            scenario_id=scen.id,
            entity_type=ev.entity_type,
            entity_id=ev.entity_id,
            disruption_type=ev.disruption_type,
            start_day=ev.start_day,
            duration_days=ev.duration_days,
            capacity_reduction_pct=ev.capacity_reduction_pct,
            extra_lead_time_days=ev.extra_lead_time_days,
            notes=ev.notes
        )
        db.add(event)

    db.commit()
    db.refresh(scen)
    return scen

@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario_detail(
    scenario_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    scen = db.query(DisruptionScenario).filter(
        DisruptionScenario.id == scenario_id,
        DisruptionScenario.organization_id == org_id
    ).first()
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scen

@router.post("/{scenario_id}/duplicate", response_model=ScenarioResponse)
def duplicate_scenario(
    scenario_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user)
):
    scen = db.query(DisruptionScenario).filter(
        DisruptionScenario.id == scenario_id,
        DisruptionScenario.organization_id == org_id
    ).first()
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario not found")

    new_scen = DisruptionScenario(
        organization_id=org_id,
        name=f"Copy of {scen.name}",
        description=scen.description,
        horizon_days=scen.horizon_days,
        status="DRAFT",
        created_by_id=current_user.id
    )
    db.add(new_scen)
    db.flush()

    for ev in scen.events:
        new_ev = DisruptionEvent(
            scenario_id=new_scen.id,
            entity_type=ev.entity_type,
            entity_id=ev.entity_id,
            disruption_type=ev.disruption_type,
            start_day=ev.start_day,
            duration_days=ev.duration_days,
            capacity_reduction_pct=ev.capacity_reduction_pct,
            extra_lead_time_days=ev.extra_lead_time_days,
            notes=ev.notes
        )
        db.add(new_ev)

    db.commit()
    db.refresh(new_scen)
    return new_scen

@router.delete("/{scenario_id}")
def delete_scenario(
    scenario_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    scen = db.query(DisruptionScenario).filter(
        DisruptionScenario.id == scenario_id,
        DisruptionScenario.organization_id == org_id
    ).first()
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(scen)
    db.commit()
    return {"message": f"Scenario '{scen.name}' deleted successfully."}

@router.get("/templates/all", response_model=List[ScenarioTemplate])
def get_scenario_templates(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    # Find active suppliers and facilities in organization to build dynamic templates
    suppliers = db.query(Supplier).filter(Supplier.organization_id == org_id).all()
    facilities = db.query(Facility).filter(Facility.organization_id == org_id).all()

    s1 = suppliers[0].id if suppliers else "00000000-0000-0000-0000-000000000000"
    s2 = suppliers[1].id if len(suppliers) > 1 else s1
    f1 = facilities[0].id if facilities else "00000000-0000-0000-0000-000000000000"

    templates = [
        ScenarioTemplate(
            template_id="tpl-primary-supplier-shutdown",
            name="Primary Supplier Complete Shutdown (14 Days)",
            description="Models complete 100% capacity cessation for 14 days due to catastrophic factory fire or strike.",
            horizon_days=60,
            events=[
                {
                    "entity_type": "SUPPLIER",
                    "entity_id": s1,
                    "disruption_type": "SHUTDOWN",
                    "start_day": 5,
                    "duration_days": 14,
                    "capacity_reduction_pct": 100.0,
                    "extra_lead_time_days": 0,
                    "notes": "14-day total plant closure"
                }
            ]
        ),
        ScenarioTemplate(
            template_id="tpl-capacity-reduction-50",
            name="50% Supplier Capacity Reduction (30 Days)",
            description="Models prolonged 50% capacity curtailment caused by regional power rationing or component shortages.",
            horizon_days=60,
            events=[
                {
                    "entity_type": "SUPPLIER",
                    "entity_id": s1,
                    "disruption_type": "CAPACITY_REDUCTION",
                    "start_day": 3,
                    "duration_days": 30,
                    "capacity_reduction_pct": 50.0,
                    "extra_lead_time_days": 0,
                    "notes": "50% capacity curtailment"
                }
            ]
        ),
        ScenarioTemplate(
            template_id="tpl-port-congestion-21",
            name="Transpacific Port Closure & Logistics Delay (21 Days)",
            description="Simulates major ocean port shutdown resulting in 18 days of additional transit lead time on overseas components.",
            horizon_days=60,
            events=[
                {
                    "entity_type": "CORRIDOR",
                    "entity_id": s1,
                    "disruption_type": "PORT_CLOSURE",
                    "start_day": 2,
                    "duration_days": 21,
                    "capacity_reduction_pct": 0.0,
                    "extra_lead_time_days": 18,
                    "notes": "Major port congestion surge"
                }
            ]
        ),
        ScenarioTemplate(
            template_id="tpl-multi-tier-cascade",
            name="Multiple Simultaneous Supplier Disruptions",
            description="Compound disruption: Tier 2 component supplier shutdown combined with Tier 3 raw material capacity reduction.",
            horizon_days=60,
            events=[
                {
                    "entity_type": "SUPPLIER",
                    "entity_id": s1,
                    "disruption_type": "SHUTDOWN",
                    "start_day": 4,
                    "duration_days": 14,
                    "capacity_reduction_pct": 100.0,
                    "extra_lead_time_days": 0,
                    "notes": "Primary supplier outage"
                },
                {
                    "entity_type": "SUPPLIER",
                    "entity_id": s2,
                    "disruption_type": "CAPACITY_REDUCTION",
                    "start_day": 8,
                    "duration_days": 20,
                    "capacity_reduction_pct": 60.0,
                    "extra_lead_time_days": 7,
                    "notes": "Secondary raw material delay"
                }
            ]
        )
    ]
    return templates
