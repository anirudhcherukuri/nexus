import pytest
from app.models.tenant import Organization
from app.models.supply_network import Supplier, Facility, Material, Product, BillOfMaterial, Inventory, SupplyEdge
from app.models.scenario import DisruptionScenario, DisruptionEvent
from app.engine.simulation_engine import DeterministicSimulationEngine

def test_deterministic_simulation_reproducibility():
    """Verify that the simulation produces identical, repeatable outputs for identical inputs."""
    org_id = "test-org-123"
    scen = DisruptionScenario(id="scen-1", organization_id=org_id, name="Test Disruption", horizon_days=30)
    
    sup = Supplier(id="sup-1", organization_id=org_id, name="Core Supplier", code="SUP-1", tier="Tier 1", country="USA", city="Detroit", daily_capacity=1000.0, current_utilization=80.0, lead_time_days=3)
    fac = Facility(id="fac-1", organization_id=org_id, name="Detroit Plant", code="PLT-1", facility_type="PLANT", country="USA", city="Detroit", daily_production_capacity=500.0, current_utilization=80.0)
    mat = Material(id="mat-1", organization_id=org_id, sku="MAT-1", name="Steel Plate", standard_cost=50.0, is_critical=True)
    prd = Product(id="prd-1", organization_id=org_id, sku="PRD-1", name="Heavy Chassis", selling_price=500.0, target_daily_demand=100.0)
    bom = BillOfMaterial(id="bom-1", organization_id=org_id, product_id=prd.id, material_id=mat.id, quantity_required=1.0)
    inv = Inventory(id="inv-1", organization_id=org_id, facility_id=fac.id, material_id=mat.id, quantity_on_hand=500.0, safety_stock=100.0)
    edge = SupplyEdge(id="edge-1", organization_id=org_id, source_type="SUPPLIER", source_id=sup.id, target_type="FACILITY", target_id=fac.id, material_id=mat.id, daily_supply_quantity=100.0, lead_time_days=3, dependency_percentage=100.0)

    # Disruption: Supplier completely shuts down for 10 days
    ev = DisruptionEvent(id="ev-1", scenario_id=scen.id, entity_type="SUPPLIER", entity_id=sup.id, disruption_type="SHUTDOWN", start_day=2, duration_days=10, capacity_reduction_pct=100.0)
    scen.events = [ev]

    engine1 = DeterministicSimulationEngine(
        scenario=scen,
        suppliers=[sup],
        facilities=[fac],
        materials=[mat],
        products=[prd],
        boms=[bom],
        inventories=[inv],
        edges=[edge]
    )
    result1 = engine1.run()

    engine2 = DeterministicSimulationEngine(
        scenario=scen,
        suppliers=[sup],
        facilities=[fac],
        materials=[mat],
        products=[prd],
        boms=[bom],
        inventories=[inv],
        edges=[edge]
    )
    result2 = engine2.run()

    # Exact equality checks on deterministic metrics
    assert result1["total_revenue_loss"] == result2["total_revenue_loss"]
    assert result1["total_units_lost"] == result2["total_units_lost"]
    assert result1["resilience_score"] == result2["resilience_score"]
    assert result1["stockout_day"] == result2["stockout_day"]
    assert len(result1["daily_metrics"]) == 30
    assert result1["total_revenue_loss"] > 0
    assert result1["total_units_lost"] > 0
