import networkx as nx
from typing import Dict, List, Any, Tuple
from app.models.supply_network import Supplier, Facility, SupplyEdge, Material

class NetworkGraphEngine:
    def __init__(self, suppliers: List[Supplier], facilities: List[Facility], edges: List[SupplyEdge], materials: List[Material]):
        self.suppliers = {s.id: s for s in suppliers}
        self.facilities = {f.id: f for f in facilities}
        self.materials = {m.id: m for m in materials}
        self.edges = edges
        self.graph = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        # Add supplier nodes
        for s_id, s in self.suppliers.items():
            self.graph.add_node(
                s_id,
                name=s.name,
                code=s.code,
                category="SUPPLIER",
                tier=s.tier,
                country=s.country,
                city=s.city,
                capacity=s.daily_capacity,
                utilization=s.current_utilization,
                lead_time=s.lead_time_days,
                reliability=s.reliability_score,
                status=s.status,
                risk_score=(s.financial_risk + s.operational_risk) / 2.0
            )

        # Add facility nodes
        for f_id, f in self.facilities.items():
            self.graph.add_node(
                f_id,
                name=f.name,
                code=f.code,
                category="FACILITY",
                tier="Tier 0" if f.facility_type == "PLANT" else "Downstream",
                country=f.country,
                city=f.city,
                capacity=f.daily_production_capacity,
                utilization=f.current_utilization,
                lead_time=0,
                reliability=0.98,
                status=f.operating_status,
                risk_score=0.1
            )

        # Add supply edges
        for edge in self.edges:
            mat_name = self.materials[edge.material_id].name if edge.material_id in self.materials else "Components"
            self.graph.add_edge(
                edge.source_id,
                edge.target_id,
                id=edge.id,
                material_id=edge.material_id,
                material_name=mat_name,
                daily_quantity=edge.daily_supply_quantity,
                lead_time=edge.lead_time_days,
                cost=edge.transit_cost_per_unit,
                dependency=edge.dependency_percentage
            )

    def calculate_metrics(self) -> Dict[str, Any]:
        """Calculates betweenness centrality, degree metrics, and identifying single points of failure."""
        if len(self.graph.nodes) == 0:
            return {"betweenness": {}, "spofs": [], "critical_nodes": []}

        # Betweenness centrality
        try:
            betweenness = nx.betweenness_centrality(self.graph)
        except Exception:
            betweenness = {n: 0.0 for n in self.graph.nodes}

        # In-degree & Out-degree
        in_degrees = dict(self.graph.in_degree())
        out_degrees = dict(self.graph.out_degree())

        # Single Points of Failure:
        # A supplier node is a SPOF if it is a sole provider to a downstream node with high dependency
        spofs = []
        critical_nodes = []
        for node in self.graph.nodes:
            # Check if any successor has in-degree == 1 from this node with dependency >= 80%
            successors = list(self.graph.successors(node))
            is_spof = False
            for succ in successors:
                edge_data = self.graph.get_edge_data(node, succ)
                dep = edge_data.get("dependency", 100.0)
                # If target has only 1 incoming supplier for that material or high dependency
                if dep >= 75.0 or self.graph.in_degree(succ) == 1:
                    is_spof = True
                    break

            cent = betweenness.get(node, 0.0)
            if is_spof or cent > 0.08:
                critical_nodes.append(node)
            if is_spof:
                spofs.append(node)

        return {
            "betweenness": betweenness,
            "in_degrees": in_degrees,
            "out_degrees": out_degrees,
            "spofs": spofs,
            "critical_nodes": critical_nodes
        }

    def trace_downstream_impact(self, node_id: str) -> List[str]:
        """Traces all downstream facilities and nodes affected if node_id fails."""
        if node_id not in self.graph:
            return []
        visited = set()
        queue = [node_id]
        while queue:
            curr = queue.pop(0)
            for succ in self.graph.successors(curr):
                if succ not in visited:
                    visited.add(succ)
                    queue.append(succ)
        return list(visited)

    def get_react_flow_elements(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Formats nodes and edges with deterministic multi-tier layout coordinates for React Flow."""
        metrics = self.calculate_metrics()
        spof_set = set(metrics["spofs"])
        betweenness = metrics["betweenness"]

        nodes = []
        edges = []

        # Tier columns X coordinates
        tier_x_map = {
            "Tier 3": 80,
            "Tier 2": 420,
            "Tier 1": 760,
            "Tier 0": 1100,
            "Downstream": 1440
        }

        # Track tier Y positions for clean visual alignment
        tier_y_counts = {"Tier 3": 60, "Tier 2": 60, "Tier 1": 80, "Tier 0": 100, "Downstream": 120}

        for node_id, data in self.graph.nodes(data=True):
            tier = data.get("tier", "Tier 2")
            if tier not in tier_x_map:
                tier = "Tier 2"

            x = tier_x_map[tier]
            y = tier_y_counts[tier]
            tier_y_counts[tier] += 120  # vertical spacing

            is_spof = node_id in spof_set
            cent = betweenness.get(node_id, 0.0)

            # Determine risk level
            risk_score = data.get("risk_score", 0.2)
            if is_spof or risk_score >= 0.7:
                risk_level = "CRITICAL"
            elif risk_score >= 0.4 or cent > 0.1:
                risk_level = "HIGH"
            elif risk_score >= 0.2:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            nodes.append({
                "id": node_id,
                "label": data.get("name", node_id),
                "node_type": f"{data.get('category')}_{tier.replace(' ', '_')}",
                "tier": tier,
                "location": f"{data.get('city')}, {data.get('country')}",
                "capacity": data.get("capacity", 0.0),
                "utilization": data.get("utilization", 0.0),
                "risk_level": risk_level,
                "status": data.get("status", "ACTIVE"),
                "is_spof": is_spof,
                "betweenness_centrality": round(cent, 4),
                "position": {"x": x, "y": y},
                "details": {
                    "code": data.get("code"),
                    "reliability": data.get("reliability"),
                    "lead_time": data.get("lead_time")
                }
            })

        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "id": data.get("id", f"edge-{u}-{v}"),
                "source": u,
                "target": v,
                "material": data.get("material_name"),
                "quantity": data.get("daily_quantity", 0.0),
                "lead_time": data.get("lead_time", 0),
                "unit_cost": data.get("cost", 0.0),
                "dependency_percentage": data.get("dependency", 100.0),
                "is_critical_path": u in spof_set or v in spof_set
            })

        return nodes, edges
