import copy
from typing import Dict, List, Any, Optional
from datetime import datetime
import pandas as pd
import numpy as np

from app.models.supply_network import Supplier, Facility, Material, Product, BillOfMaterial, Inventory, SupplyEdge
from app.models.scenario import DisruptionScenario, DisruptionEvent
from app.engine.bom_engine import BOMEngine

class DeterministicSimulationEngine:
    """
    Core Deterministic Discrete-Time Simulation Engine for NEXUS.
    Evaluates multi-tier supply chain dynamics, cascading disruptions,
    BOM constraints, inventory depletion, backlog accumulation, and financial impacts.
    All calculations are strictly deterministic with no arbitrary random generation.
    """

    def __init__(
        self,
        scenario: DisruptionScenario,
        suppliers: List[Supplier],
        facilities: List[Facility],
        materials: List[Material],
        products: List[Product],
        boms: List[BillOfMaterial],
        inventories: List[Inventory],
        edges: List[SupplyEdge]
    ):
        self.scenario = scenario
        self.horizon_days = max(10, min(180, scenario.horizon_days or 60))
        self.suppliers_map = {s.id: s for s in suppliers}
        self.facilities_map = {f.id: f for f in facilities}
        self.materials_map = {m.id: m for m in materials}
        self.products_map = {p.id: p for p in products}
        self.inventories = inventories
        self.edges = edges
        self.bom_engine = BOMEngine(boms, materials, products)

        # Parse disruption events
        self.disruption_events = scenario.events if hasattr(scenario, "events") and scenario.events else []

    def run(self) -> Dict[str, Any]:
        """
        Executes both baseline (undisrupted) and disrupted simulations
        to calculate differential impacts, recovery times, and resilience scores.
        """
        baseline_results = self._simulate(apply_disruptions=False)
        disrupted_results = self._simulate(apply_disruptions=True)

        # Calculate differential impacts
        total_baseline_units = sum(d["baseline_production"] for d in baseline_results["daily_metrics"])
        total_actual_units = sum(d["actual_production"] for d in disrupted_results["daily_metrics"])
        total_units_lost = max(0.0, total_baseline_units - total_actual_units)

        total_financial_loss = disrupted_results["total_financial_loss"]
        max_delay_days = disrupted_results["max_delay_days"]
        stockout_day = disrupted_results["earliest_stockout_day"]
        recovery_day = disrupted_results["recovery_day"]

        # Deterministic Network Resilience Score: 0 to 100
        if total_baseline_units > 0:
            continuity_ratio = max(0.0, min(1.0, total_actual_units / total_baseline_units))
            delay_penalty = min(0.4, (max_delay_days / self.horizon_days) * 0.4)
            resilience_score = round(max(0.0, (continuity_ratio - delay_penalty) * 100.0), 1)
        else:
            resilience_score = 100.0

        impacted_suppliers = list(set(disrupted_results["impacted_supplier_ids"]))
        impacted_facilities = list(set(disrupted_results["impacted_facility_ids"]))

        summary = (
            f"Simulation over {self.horizon_days}-day horizon identified {len(impacted_suppliers)} disrupted suppliers "
            f"and {len(impacted_facilities)} impacted manufacturing facilities. Total production loss is "
            f"{int(total_units_lost):,} units resulting in ${total_financial_loss:,.2f} calculated financial impact. "
            f"Earliest stockout occurs on Day {stockout_day or 'N/A'}. Network Resilience Score is {resilience_score}/100."
        )

        return {
            "scenario_id": self.scenario.id,
            "horizon_days": self.horizon_days,
            "resilience_score": resilience_score,
            "total_revenue_loss": total_financial_loss,
            "total_units_lost": total_units_lost,
            "max_delay_days": max_delay_days,
            "stockout_day": stockout_day,
            "recovery_day": recovery_day,
            "impacted_suppliers": impacted_suppliers,
            "impacted_facilities": impacted_facilities,
            "run_summary": summary,
            "daily_metrics": disrupted_results["daily_metrics"],
            "product_impacts": disrupted_results["product_impacts"],
            "assumptions": {
                "calculation_engine": "NEXUS Deterministic Discrete-Time Simulator v2.0",
                "backlog_penalty_per_unit_day": 15.0,
                "cogs_calculation": "Standard multi-level BOM explosion",
                "holding_cost_rate_annual": 0.18,
                "seed": 42,
                "is_stochastic": False
            }
        }

    def _simulate(self, apply_disruptions: bool = True) -> Dict[str, Any]:
        """Runs day-by-day discrete time step simulation."""
        # Initialize plant-level inventory map: {(facility_id, material_id): current_stock}
        inventory_state: Dict[Tuple[str, str], float] = {}
        for inv in self.inventories:
            inventory_state[(inv.facility_id, inv.material_id)] = float(inv.quantity_on_hand)

        # In-transit pipeline shipments: list of {arrival_day, facility_id, material_id, quantity}
        in_transit_pipeline: List[Dict[str, Any]] = []

        # Product-level backlog tracker: {product_id: accumulated_units}
        backlog_state: Dict[str, float] = {p_id: 0.0 for p_id in self.products_map.keys()}

        # Output aggregations
        daily_metrics: List[Dict[str, Any]] = []
        product_produced_totals: Dict[str, float] = {p_id: 0.0 for p_id in self.products_map.keys()}
        product_demanded_totals: Dict[str, float] = {p_id: 0.0 for p_id in self.products_map.keys()}
        product_stockout_days: Dict[str, Optional[int]] = {p_id: None for p_id in self.products_map.keys()}

        cumulative_financial_loss = 0.0
        earliest_stockout_day = None
        max_delay_days = 0
        recovery_day = None
        impacted_supplier_ids = []
        impacted_facility_ids = []

        # Prepare active disruption index by day
        # day -> list of events
        daily_disruptions: Dict[int, List[DisruptionEvent]] = {d: [] for d in range(1, self.horizon_days + 1)}
        if apply_disruptions:
            for ev in self.disruption_events:
                start = max(1, ev.start_day)
                end = min(self.horizon_days, start + ev.duration_days - 1)
                for d in range(start, end + 1):
                    daily_disruptions[d].append(ev)

        # Daily simulation loop
        for day in range(1, self.horizon_days + 1):
            active_events = daily_disruptions.get(day, [])
            active_disruption_count = len(active_events)

            # Map disrupted entities on this day: entity_id -> reduction_pct
            disrupted_suppliers = {}
            disrupted_corridors_leadtime = {}
            for ev in active_events:
                if ev.entity_type == "SUPPLIER":
                    disrupted_suppliers[ev.entity_id] = ev.capacity_reduction_pct
                    impacted_supplier_ids.append(ev.entity_id)
                elif ev.entity_type == "CORRIDOR":
                    disrupted_corridors_leadtime[ev.entity_id] = ev.extra_lead_time_days

            # 1. Dispatch new orders from suppliers along supply edges
            for edge in self.edges:
                sup = self.suppliers_map.get(edge.source_id)
                if not sup or not edge.material_id:
                    continue

                nominal_daily_dispatch = edge.daily_supply_quantity
                reduction_pct = disrupted_suppliers.get(edge.source_id, 0.0) if apply_disruptions else 0.0
                actual_dispatch = nominal_daily_dispatch * (1.0 - (reduction_pct / 100.0))

                effective_lead_time = edge.lead_time_days
                if apply_disruptions and edge.id in disrupted_corridors_leadtime:
                    effective_lead_time += disrupted_corridors_leadtime[edge.id]

                arrival_day = day + max(1, effective_lead_time)
                if arrival_day <= self.horizon_days and actual_dispatch > 0:
                    in_transit_pipeline.append({
                        "arrival_day": arrival_day,
                        "facility_id": edge.target_id,
                        "material_id": edge.material_id,
                        "quantity": actual_dispatch
                    })

            # 2. Receive shipments arriving on this day
            arrived_shipments = [s for s in in_transit_pipeline if s["arrival_day"] == day]
            for ship in arrived_shipments:
                key = (ship["facility_id"], ship["material_id"])
                inventory_state[key] = inventory_state.get(key, 0.0) + ship["quantity"]

            # 3. Production calculation for manufacturing facilities
            day_baseline_production = 0.0
            day_actual_production = 0.0
            day_units_lost = 0.0
            day_financial_loss = 0.0

            # Distribute product targets across primary manufacturing plants
            manufacturing_plants = [f for f in self.facilities_map.values() if f.facility_type == "PLANT"]
            if not manufacturing_plants:
                manufacturing_plants = list(self.facilities_map.values())

            for prod_id, product in self.products_map.items():
                unit_selling_price = float(product.selling_price)
                unit_cogs = float(self.bom_engine.calculate_cogs(prod_id))
                unit_gross_margin = max(50.0, unit_selling_price - unit_cogs)
                target_demand = float(product.target_daily_demand)

                product_demanded_totals[prod_id] += target_demand
                day_baseline_production += target_demand

                needed_production = target_demand + backlog_state[prod_id]

                # Check BOM feasibility against plant inventory
                # Aggregate available inventory across plants producing this product
                combined_inventory: Dict[str, float] = {}
                for plant in manufacturing_plants:
                    for mat_req in self.bom_engine.get_materials_for_product(prod_id):
                        m_id = mat_req["material_id"]
                        combined_inventory[m_id] = combined_inventory.get(m_id, 0.0) + inventory_state.get((plant.id, m_id), 0.0)

                feasible_units = self.bom_engine.calculate_feasible_units(prod_id, combined_inventory)
                plant_capacity_limit = sum(p.daily_production_capacity for p in manufacturing_plants)

                actual_units = min(needed_production, feasible_units, plant_capacity_limit)
                product_produced_totals[prod_id] += actual_units
                day_actual_production += actual_units

                # Deduct consumed materials from plant inventories
                for plant in manufacturing_plants:
                    for mat_req in self.bom_engine.get_materials_for_product(prod_id):
                        m_id = mat_req["material_id"]
                        qty_to_deduct = actual_units * mat_req["quantity_required"]
                        curr_stock = inventory_state.get((plant.id, m_id), 0.0)
                        inventory_state[(plant.id, m_id)] = max(0.0, curr_stock - qty_to_deduct)

                # Backlog calculation
                unfulfilled_today = max(0.0, needed_production - actual_units)
                backlog_state[prod_id] = unfulfilled_today

                # Check for stockout / shortages
                if actual_units < target_demand:
                    shortage = target_demand - actual_units
                    day_units_lost += shortage
                    # Lost margin + backlog penalty
                    loss_for_product = (shortage * unit_gross_margin) + (unfulfilled_today * 15.0)
                    day_financial_loss += loss_for_product

                    if product_stockout_days[prod_id] is None:
                        product_stockout_days[prod_id] = day
                        if earliest_stockout_day is None:
                            earliest_stockout_day = day

                    # Track facility impact
                    for plant in manufacturing_plants:
                        impacted_facility_ids.append(plant.id)

            # Check if system is delayed
            total_current_backlog = sum(backlog_state.values())
            if total_current_backlog > 0:
                delay_estimate = int(total_current_backlog / max(1.0, day_baseline_production))
                max_delay_days = max(max_delay_days, delay_estimate)

            # Check for recovery: if active disruptions have ceased and backlog returns to 0
            if active_disruption_count == 0 and total_current_backlog == 0 and day > 14 and recovery_day is None:
                recovery_day = day

            cumulative_financial_loss += day_financial_loss

            daily_metrics.append({
                "day": day,
                "baseline_production": round(day_baseline_production, 1),
                "actual_production": round(day_actual_production, 1),
                "units_lost": round(day_units_lost, 1),
                "accumulated_backlog": round(total_current_backlog, 1),
                "active_disruptions_count": active_disruption_count,
                "daily_financial_loss": round(day_financial_loss, 2),
                "cumulative_financial_loss": round(cumulative_financial_loss, 2)
            })

        # Calculate per-product impacts
        product_impacts: List[Dict[str, Any]] = []
        for prod_id, product in self.products_map.items():
            demanded = product_demanded_totals[prod_id]
            produced = product_produced_totals[prod_id]
            short = max(0.0, demanded - produced)
            margin = float(product.selling_price) - float(self.bom_engine.calculate_cogs(prod_id))
            rev_loss = round(short * margin, 2)

            product_impacts.append({
                "product_id": prod_id,
                "product_name": product.name,
                "units_demanded": round(demanded, 1),
                "units_produced": round(produced, 1),
                "units_short": round(short, 1),
                "total_revenue_loss": rev_loss,
                "stockout_day": product_stockout_days.get(prod_id)
            })

        return {
            "daily_metrics": daily_metrics,
            "product_impacts": product_impacts,
            "total_financial_loss": round(cumulative_financial_loss, 2),
            "max_delay_days": max_delay_days,
            "earliest_stockout_day": earliest_stockout_day,
            "recovery_day": recovery_day,
            "impacted_supplier_ids": impacted_supplier_ids,
            "impacted_facility_ids": impacted_facility_ids
        }
