from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.supply_network import Supplier, Facility, SupplyEdge, Material
from app.api.deps import get_current_org_id
from app.engine.graph_engine import NetworkGraphEngine
from app.schemas.network import NetworkGraphResponse, CriticalSupplierReport

router = APIRouter(prefix="/network", tags=["Supply Network"])

@router.get("/graph", response_model=NetworkGraphResponse)
def get_supply_network_graph(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    suppliers = db.query(Supplier).filter(Supplier.organization_id == org_id).all()
    facilities = db.query(Facility).filter(Facility.organization_id == org_id).all()
    materials = db.query(Material).filter(Material.organization_id == org_id).all()
    edges = db.query(SupplyEdge).filter(SupplyEdge.organization_id == org_id).all()

    engine = NetworkGraphEngine(suppliers, facilities, edges, materials)
    nodes, flow_edges = engine.get_react_flow_elements()
    metrics = engine.calculate_metrics()

    tier_counts = {
        "Tier 3": len([s for s in suppliers if s.tier == "Tier 3"]),
        "Tier 2": len([s for s in suppliers if s.tier == "Tier 2"]),
        "Tier 1": len([s for s in suppliers if s.tier == "Tier 1"]),
        "Tier 0": len([f for f in facilities if f.facility_type == "PLANT"]),
        "Downstream": len([f for f in facilities if f.facility_type != "PLANT"]),
    }

    return {
        "nodes": nodes,
        "edges": flow_edges,
        "total_nodes": len(nodes),
        "total_edges": len(flow_edges),
        "spof_count": len(metrics["spofs"]),
        "tier_counts": tier_counts
    }

@router.get("/criticality", response_model=List[CriticalSupplierReport])
def get_critical_suppliers(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    suppliers = db.query(Supplier).filter(Supplier.organization_id == org_id).all()
    facilities = db.query(Facility).filter(Facility.organization_id == org_id).all()
    materials = db.query(Material).filter(Material.organization_id == org_id).all()
    edges = db.query(SupplyEdge).filter(SupplyEdge.organization_id == org_id).all()

    engine = NetworkGraphEngine(suppliers, facilities, edges, materials)
    metrics = engine.calculate_metrics()
    spof_set = set(metrics["spofs"])
    betweenness = metrics["betweenness"]

    reports = []
    for s in suppliers:
        cent = betweenness.get(s.id, 0.0)
        is_spof = s.id in spof_set
        downstream = engine.trace_downstream_impact(s.id)
        
        # Risk score calculation
        risk_score = round(((s.financial_risk + s.operational_risk) / 2.0) + (0.3 if is_spof else 0.0), 2)
        
        # Materials supplied
        mat_edges = [e for e in edges if e.source_id == s.id and e.material_id]
        m_names = [engine.materials[e.material_id].name for e in mat_edges if e.material_id in engine.materials]

        reports.append(CriticalSupplierReport(
            supplier_id=s.id,
            name=s.name,
            tier=s.tier,
            country=s.country,
            downstream_impact_count=len(downstream),
            dependent_facilities=[engine.facilities[f_id].name for f_id in downstream if f_id in engine.facilities],
            betweenness_centrality=round(cent, 4),
            risk_score=min(1.0, risk_score),
            is_spof=is_spof,
            supplied_materials=m_names
        ))

    # Sort descending by risk score and betweenness
    reports.sort(key=lambda x: (x.is_spof, x.risk_score, x.betweenness_centrality), reverse=True)
    return reports
