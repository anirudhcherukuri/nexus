import pytest
from app.models.supply_network import Supplier, Facility, Material, SupplyEdge
from app.engine.graph_engine import NetworkGraphEngine

def test_spof_and_downstream_impact():
    org_id = "test-org-graph"
    s1 = Supplier(id="s1", organization_id=org_id, name="Sole Tier 3 Supplier", code="S1", tier="Tier 3", country="Japan", city="Nagoya", daily_capacity=1000.0, current_utilization=85.0, financial_risk=0.2, operational_risk=0.2)
    s2 = Supplier(id="s2", organization_id=org_id, name="Tier 2 Fab", code="S2", tier="Tier 2", country="Taiwan", city="Hsinchu", daily_capacity=800.0, current_utilization=90.0, financial_risk=0.3, operational_risk=0.3)
    f1 = Facility(id="f1", organization_id=org_id, name="Plant Detroit", code="F1", facility_type="PLANT", country="USA", city="Detroit", daily_production_capacity=500.0, current_utilization=80.0)
    m1 = Material(id="m1", organization_id=org_id, sku="M1", name="Silicon", standard_cost=100.0)

    # Chain: s1 -> s2 -> f1
    e1 = SupplyEdge(id="e1", organization_id=org_id, source_type="SUPPLIER", source_id=s1.id, target_type="SUPPLIER", target_id=s2.id, material_id=m1.id, daily_supply_quantity=100.0, lead_time_days=5, dependency_percentage=100.0)
    e2 = SupplyEdge(id="e2", organization_id=org_id, source_type="SUPPLIER", source_id=s2.id, target_type="FACILITY", target_id=f1.id, material_id=m1.id, daily_supply_quantity=100.0, lead_time_days=7, dependency_percentage=100.0)

    engine = NetworkGraphEngine(suppliers=[s1, s2], facilities=[f1], edges=[e1, e2], materials=[m1])
    metrics = engine.calculate_metrics()

    # S1 and S2 must be detected as SPOF because they have 100% dependency
    assert s1.id in metrics["spofs"]
    assert s2.id in metrics["spofs"]

    # Downstream impact of S1 must include S2 and F1
    downstream = engine.trace_downstream_impact(s1.id)
    assert s2.id in downstream
    assert f1.id in downstream
