from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.simulation import SimulationRun
from app.models.scenario import DisruptionScenario
from app.models.mitigation import MitigationPlan
from app.models.supply_network import Supplier, Facility, Material, Product, BillOfMaterial, Inventory, SupplyEdge
from app.api.deps import get_current_org_id, get_current_user
from app.models.user import User
from app.engine.mitigation_optimizer import MitigationOptimizer
from app.schemas.mitigation import MitigationOptimizeRequest, MitigationPlanResponse

router = APIRouter(prefix="/mitigations", tags=["Mitigation Planner"])

@router.post("/optimize", response_model=List[MitigationPlanResponse])
def optimize_mitigation_strategies(
    payload: MitigationOptimizeRequest,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user)
):
    sim = db.query(SimulationRun).filter(
        SimulationRun.id == payload.simulation_run_id,
        SimulationRun.organization_id == org_id
    ).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation run not found")

    scenario = db.query(DisruptionScenario).filter(DisruptionScenario.id == sim.scenario_id).first()
    suppliers = db.query(Supplier).filter(Supplier.organization_id == org_id).all()
    facilities = db.query(Facility).filter(Facility.organization_id == org_id).all()
    materials = db.query(Material).filter(Material.organization_id == org_id).all()
    products = db.query(Product).filter(Product.organization_id == org_id).all()
    boms = db.query(BillOfMaterial).filter(BillOfMaterial.organization_id == org_id).all()
    inventories = db.query(Inventory).filter(Inventory.organization_id == org_id).all()
    edges = db.query(SupplyEdge).filter(SupplyEdge.organization_id == org_id).all()

    sim_result_summary = {
        "simulation_run_id": sim.id,
        "total_revenue_loss": sim.total_revenue_loss,
        "total_units_lost": sim.total_units_lost,
        "max_delay_days": sim.max_delay_days,
        "impacted_suppliers": [ev.entity_id for ev in scenario.events if ev.entity_type == "SUPPLIER"] if scenario and scenario.events else []
    }

    optimizer = MitigationOptimizer(
        scenario=scenario,
        simulation_result=sim_result_summary,
        suppliers=suppliers,
        facilities=facilities,
        materials=materials,
        products=products,
        boms=boms,
        inventories=inventories,
        edges=edges
    )

    strategies = optimizer.generate_strategies(objective=payload.optimization_objective)

    # Persist plans
    saved_plans = []
    for s in strategies:
        plan = MitigationPlan(
            organization_id=org_id,
            simulation_run_id=sim.id,
            strategy_name=s["strategy_name"],
            strategy_type=s["strategy_type"],
            description=s["description"],
            additional_procurement_cost=s["additional_procurement_cost"],
            additional_logistics_cost=s["additional_logistics_cost"],
            units_recovered=s["units_recovered"],
            avoided_revenue_loss=s["avoided_revenue_loss"],
            net_financial_benefit=s["net_financial_benefit"],
            recovery_days_saved=s["recovery_days_saved"],
            feasibility_score=s["feasibility_score"],
            parameters_json=s.get("parameters")
        )
        db.add(plan)
        saved_plans.append(plan)

    db.commit()
    for p in saved_plans:
        db.refresh(p)

    return saved_plans

@router.get("/simulation/{simulation_id}", response_model=List[MitigationPlanResponse])
def get_plans_for_simulation(
    simulation_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    return db.query(MitigationPlan).filter(
        MitigationPlan.simulation_run_id == simulation_id,
        MitigationPlan.organization_id == org_id
    ).all()

@router.get("/{plan_id}", response_model=MitigationPlanResponse)
def get_mitigation_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    plan = db.query(MitigationPlan).filter(
        MitigationPlan.id == plan_id,
        MitigationPlan.organization_id == org_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Mitigation plan not found")
    return plan
