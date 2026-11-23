from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scenario import DisruptionScenario
from app.models.simulation import SimulationRun, DailySimulationMetric, ProductSimulationImpact
from app.models.supply_network import Supplier, Facility, Material, Product, BillOfMaterial, Inventory, SupplyEdge
from app.api.deps import get_current_org_id, get_current_user
from app.models.user import User
from app.engine.simulation_engine import DeterministicSimulationEngine
from app.schemas.simulation import (
    SimulationRunRequest, SimulationRunResponse, SimulationCompareRequest,
    SimulationCompareResponse, ScenarioComparisonMetric
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/simulations", tags=["Simulation Lab"])

@router.post("/run", response_model=SimulationRunResponse)
def execute_simulation(
    payload: SimulationRunRequest,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user)
):
    scenario = db.query(DisruptionScenario).filter(
        DisruptionScenario.id == payload.scenario_id,
        DisruptionScenario.organization_id == org_id
    ).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    suppliers = db.query(Supplier).filter(Supplier.organization_id == org_id).all()
    facilities = db.query(Facility).filter(Facility.organization_id == org_id).all()
    materials = db.query(Material).filter(Material.organization_id == org_id).all()
    products = db.query(Product).filter(Product.organization_id == org_id).all()
    boms = db.query(BillOfMaterial).filter(BillOfMaterial.organization_id == org_id).all()
    inventories = db.query(Inventory).filter(Inventory.organization_id == org_id).all()
    edges = db.query(SupplyEdge).filter(SupplyEdge.organization_id == org_id).all()

    # Deterministic simulation run
    sim_engine = DeterministicSimulationEngine(
        scenario=scenario,
        suppliers=suppliers,
        facilities=facilities,
        materials=materials,
        products=products,
        boms=boms,
        inventories=inventories,
        edges=edges
    )
    result = sim_engine.run()

    # Save to database
    run_name = payload.name or f"Sim: {scenario.name[:35]}"
    sim_run = SimulationRun(
        organization_id=org_id,
        scenario_id=scenario.id,
        name=run_name,
        status="COMPLETED",
        total_revenue_loss=result["total_revenue_loss"],
        total_units_lost=result["total_units_lost"],
        max_delay_days=result["max_delay_days"],
        stockout_day=result["stockout_day"],
        resilience_score=result["resilience_score"],
        run_summary=result["run_summary"],
        metadata_json=result["assumptions"]
    )
    db.add(sim_run)
    db.flush()

    # Insert daily metrics
    for d in result["daily_metrics"]:
        metric = DailySimulationMetric(
            simulation_run_id=sim_run.id,
            day=d["day"],
            baseline_production=d["baseline_production"],
            actual_production=d["actual_production"],
            units_lost=d["units_lost"],
            accumulated_backlog=d["accumulated_backlog"],
            active_disruptions_count=d["active_disruptions_count"],
            daily_financial_loss=d["daily_financial_loss"],
            cumulative_financial_loss=d["cumulative_financial_loss"]
        )
        db.add(metric)

    # Insert product impacts
    for p in result["product_impacts"]:
        p_impact = ProductSimulationImpact(
            simulation_run_id=sim_run.id,
            product_id=p["product_id"],
            product_name=p["product_name"],
            units_demanded=p["units_demanded"],
            units_produced=p["units_produced"],
            units_short=p["units_short"],
            total_revenue_loss=p["total_revenue_loss"],
            stockout_day=p["stockout_day"]
        )
        db.add(p_impact)

    # Update scenario status
    scenario.status = "SIMULATED"
    db.commit()
    db.refresh(sim_run)

    AuditService.log(
        db=db,
        organization_id=org_id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="SIMULATION_EXECUTED",
        entity_type="SIMULATION",
        entity_id=sim_run.id,
        details={
            "scenario_id": scenario.id,
            "total_revenue_loss": sim_run.total_revenue_loss,
            "resilience_score": sim_run.resilience_score
        }
    )

    return sim_run

@router.get("/{simulation_id}", response_model=SimulationRunResponse)
def get_simulation_detail(
    simulation_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    sim = db.query(SimulationRun).filter(
        SimulationRun.id == simulation_id,
        SimulationRun.organization_id == org_id
    ).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation run not found")
    return sim

@router.get("", response_model=List[SimulationRunResponse])
def list_simulations(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    return db.query(SimulationRun).filter(SimulationRun.organization_id == org_id).order_by(SimulationRun.executed_at.desc()).all()

@router.post("/compare", response_model=SimulationCompareResponse)
def compare_simulations(
    payload: SimulationCompareRequest,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    sims = db.query(SimulationRun).filter(
        SimulationRun.id.in_(payload.simulation_ids),
        SimulationRun.organization_id == org_id
    ).all()

    if not sims:
        raise HTTPException(status_code=404, detail="No matching simulations found for comparison")

    scenarios_meta = {s.id: s.name for s in db.query(DisruptionScenario).filter(DisruptionScenario.organization_id == org_id).all()}

    comparisons = []
    for s in sims:
        scen_name = scenarios_meta.get(s.scenario_id, s.name)
        recovery_day = s.metadata_json.get("recovery_day") if s.metadata_json else None
        comparisons.append(ScenarioComparisonMetric(
            simulation_id=s.id,
            scenario_name=scen_name,
            total_revenue_loss=s.total_revenue_loss,
            total_units_lost=s.total_units_lost,
            max_delay_days=s.max_delay_days,
            stockout_day=s.stockout_day,
            resilience_score=s.resilience_score,
            recovery_day=recovery_day
        ))

    # Determine best resilience and lowest cost
    best_resilience = max(comparisons, key=lambda x: x.resilience_score).simulation_id
    lowest_cost = min(comparisons, key=lambda x: x.total_revenue_loss).simulation_id

    tradeoffs = [
        f"Highest resilience observed in simulation {best_resilience[:8]} with score {max(c.resilience_score for c in comparisons)}/100.",
        f"Lowest financial impact observed in simulation {lowest_cost[:8]} at ${min(c.total_revenue_loss for c in comparisons):,.2f}.",
        "Longer disruption scenarios experience compounding nonlinear backlog due to upstream component exhaustion."
    ]

    return SimulationCompareResponse(
        scenarios=comparisons,
        best_resilience_scenario_id=best_resilience,
        lowest_cost_scenario_id=lowest_cost,
        key_tradeoffs=tradeoffs
    )
