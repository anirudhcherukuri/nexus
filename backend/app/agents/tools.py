from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.supply_network import Supplier, Facility, Material, Product, BillOfMaterial, Inventory, SupplyEdge
from app.models.scenario import DisruptionScenario, DisruptionEvent
from app.models.simulation import SimulationRun, DailySimulationMetric, ProductSimulationImpact
from app.models.mitigation import MitigationPlan
from app.models.approval import ApprovalRequest
from app.engine.graph_engine import NetworkGraphEngine
from app.engine.simulation_engine import DeterministicSimulationEngine
from app.engine.mitigation_optimizer import MitigationOptimizer

class AgentToolbox:
    """Tools accessible to AI agents to query the supply chain and trigger deterministic calculations."""

    def __init__(self, db: Session, org_id: str):
        self.db = db
        self.org_id = org_id

    def query_topology_and_spofs(self) -> Dict[str, Any]:
        """Tool: Retrieves multi-tier network topology and identifies single points of failure."""
        suppliers = self.db.query(Supplier).filter(Supplier.organization_id == self.org_id).all()
        facilities = self.db.query(Facility).filter(Facility.organization_id == self.org_id).all()
        materials = self.db.query(Material).filter(Material.organization_id == self.org_id).all()
        edges = self.db.query(SupplyEdge).filter(SupplyEdge.organization_id == self.org_id).all()

        engine = NetworkGraphEngine(suppliers, facilities, edges, materials)
        metrics = engine.calculate_metrics()

        spof_details = []
        for s_id in metrics["spofs"]:
            s = next((x for x in suppliers if x.id == s_id), None)
            if s:
                spof_details.append({
                    "id": s.id,
                    "name": s.name,
                    "tier": s.tier,
                    "country": s.country,
                    "capacity": s.daily_capacity,
                    "lead_time_days": s.lead_time_days,
                    "downstream_impact": engine.trace_downstream_impact(s.id)
                })

        return {
            "total_nodes": len(suppliers) + len(facilities),
            "spof_count": len(metrics["spofs"]),
            "spofs": spof_details,
            "critical_nodes": metrics["critical_nodes"]
        }

    def run_deterministic_simulation(self, scenario_id: str) -> Dict[str, Any]:
        """Tool: Triggers the exact deterministic discrete-time simulation for a scenario."""
        scenario = self.db.query(DisruptionScenario).filter(
            DisruptionScenario.id == scenario_id,
            DisruptionScenario.organization_id == self.org_id
        ).first()
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")

        suppliers = self.db.query(Supplier).filter(Supplier.organization_id == self.org_id).all()
        facilities = self.db.query(Facility).filter(Facility.organization_id == self.org_id).all()
        materials = self.db.query(Material).filter(Material.organization_id == self.org_id).all()
        products = self.db.query(Product).filter(Product.organization_id == self.org_id).all()
        boms = self.db.query(BillOfMaterial).filter(BillOfMaterial.organization_id == self.org_id).all()
        inventories = self.db.query(Inventory).filter(Inventory.organization_id == self.org_id).all()
        edges = self.db.query(SupplyEdge).filter(SupplyEdge.organization_id == self.org_id).all()

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

        results = sim_engine.run()

        # Persist simulation run to DB
        sim_run = SimulationRun(
            organization_id=self.org_id,
            scenario_id=scenario.id,
            name=f"Agent Run: {scenario.name[:40]}",
            status="COMPLETED",
            total_revenue_loss=results["total_revenue_loss"],
            total_units_lost=results["total_units_lost"],
            max_delay_days=results["max_delay_days"],
            stockout_day=results["stockout_day"],
            resilience_score=results["resilience_score"],
            run_summary=results["run_summary"],
            metadata_json=results["assumptions"]
        )
        self.db.add(sim_run)
        self.db.flush()

        for d in results["daily_metrics"]:
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
            self.db.add(metric)

        for p in results["product_impacts"]:
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
            self.db.add(p_impact)

        self.db.commit()
        results["simulation_run_id"] = sim_run.id
        return results

    def optimize_mitigation(self, simulation_result: Dict[str, Any], scenario_id: str) -> List[Dict[str, Any]]:
        """Tool: Runs mathematical optimization to generate ranked mitigation strategies."""
        scenario = self.db.query(DisruptionScenario).filter(DisruptionScenario.id == scenario_id).first()
        suppliers = self.db.query(Supplier).filter(Supplier.organization_id == self.org_id).all()
        facilities = self.db.query(Facility).filter(Facility.organization_id == self.org_id).all()
        materials = self.db.query(Material).filter(Material.organization_id == self.org_id).all()
        products = self.db.query(Product).filter(Product.organization_id == self.org_id).all()
        boms = self.db.query(BillOfMaterial).filter(BillOfMaterial.organization_id == self.org_id).all()
        inventories = self.db.query(Inventory).filter(Inventory.organization_id == self.org_id).all()
        edges = self.db.query(SupplyEdge).filter(SupplyEdge.organization_id == self.org_id).all()

        optimizer = MitigationOptimizer(
            scenario=scenario,
            simulation_result=simulation_result,
            suppliers=suppliers,
            facilities=facilities,
            materials=materials,
            products=products,
            boms=boms,
            inventories=inventories,
            edges=edges
        )

        strategies = optimizer.generate_strategies(objective="BALANCED")
        sim_id = simulation_result.get("simulation_run_id")

        # Persist mitigation strategies to DB
        persisted = []
        for s in strategies:
            plan = MitigationPlan(
                organization_id=self.org_id,
                simulation_run_id=sim_id,
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
            self.db.add(plan)
            self.db.flush()
            s["id"] = plan.id
            persisted.append(s)

        self.db.commit()
        return persisted

    def create_approval_request(self, mitigation_plan_id: str, title: str, summary: str, user_id: str) -> str:
        """Tool: Stages human-in-the-loop approval request for executive signoff."""
        plan = self.db.query(MitigationPlan).filter(MitigationPlan.id == mitigation_plan_id).first()
        req = ApprovalRequest(
            organization_id=self.org_id,
            mitigation_plan_id=mitigation_plan_id,
            simulation_run_id=plan.simulation_run_id if plan else None,
            title=title,
            recommendation_summary=summary,
            requested_by_id=user_id,
            requested_by_name="Nexus AI Agent System",
            status="PENDING"
        )
        self.db.add(req)
        self.db.commit()
        return req.id
