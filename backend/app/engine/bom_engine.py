from typing import Dict, List, Any
from app.models.supply_network import BillOfMaterial, Material, Product

class BOMEngine:
    def __init__(self, boms: List[BillOfMaterial], materials: List[Material], products: List[Product]):
        self.materials_map = {m.id: m for m in materials}
        self.products_map = {p.id: p for p in products}
        self.boms = boms
        
        # Build product_id -> list of (material_id, qty)
        self.product_bom: Dict[str, List[Dict[str, Any]]] = {}
        for bom in boms:
            if bom.product_id not in self.product_bom:
                self.product_bom[bom.product_id] = []
            mat = self.materials_map.get(bom.material_id)
            self.product_bom[bom.product_id].append({
                "material_id": bom.material_id,
                "material_name": mat.name if mat else "Unknown",
                "material_sku": mat.sku if mat else "Unknown",
                "quantity_required": bom.quantity_required,
                "standard_cost": mat.standard_cost if mat else 10.0,
                "is_critical": mat.is_critical if mat else False
            })

    def get_materials_for_product(self, product_id: str) -> List[Dict[str, Any]]:
        return self.product_bom.get(product_id, [])

    def calculate_feasible_units(self, product_id: str, available_inventory: Dict[str, float]) -> int:
        """Determines max product units that can be assembled given available inventory dict {material_id: qty}."""
        requirements = self.product_bom.get(product_id, [])
        if not requirements:
            return 999999  # No BOM constraint

        max_units = 999999
        for req in requirements:
            mat_id = req["material_id"]
            qty_needed_per_unit = req["quantity_required"]
            qty_avail = available_inventory.get(mat_id, 0.0)
            if qty_needed_per_unit > 0:
                possible = int(qty_avail // qty_needed_per_unit)
                if possible < max_units:
                    max_units = possible

        return max(0, max_units)

    def calculate_cogs(self, product_id: str) -> float:
        """Calculates standard cost of goods sold based on BOM component costs."""
        requirements = self.product_bom.get(product_id, [])
        return sum(req["quantity_required"] * req["standard_cost"] for req in requirements)
