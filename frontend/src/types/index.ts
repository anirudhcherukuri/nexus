export type UserRole =
  | 'SuperAdmin'
  | 'OrgAdmin'
  | 'SupplyChainManager'
  | 'ProcurementManager'
  | 'OperationsAnalyst'
  | 'Executive';

export interface User {
  id: string;
  organization_id: string;
  organization_name?: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  country: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  daily_capacity: number;
  current_utilization: number;
  lead_time_days: number;
  unit_cost: number;
  reliability_score: number;
  financial_risk: number;
  operational_risk: number;
  status: 'ACTIVE' | 'DISRUPTED' | 'RESTRICTED';
  is_synthetic: boolean;
  created_at: string;
}

export interface Facility {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  facility_type: 'PLANT' | 'WAREHOUSE' | 'DISTRIBUTION_CENTER' | 'LOGISTICS_HUB';
  country: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  daily_production_capacity: number;
  current_utilization: number;
  operating_status: 'NORMAL' | 'DEGRADED' | 'SHUTDOWN';
  is_synthetic: boolean;
  created_at: string;
}

export interface Material {
  id: string;
  sku: string;
  name: string;
  category: string;
  standard_cost: number;
  unit_of_measure: string;
  is_critical: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  selling_price: number;
  target_daily_demand: number;
}

export interface InventoryItem {
  id: string;
  facility_id: string;
  facility_name: string;
  material_id: string;
  material_name: string;
  material_sku: string;
  quantity_on_hand: number;
  safety_stock: number;
  reorder_point: number;
  days_of_supply: number;
}

export interface DisruptionEvent {
  id?: string;
  entity_type: 'SUPPLIER' | 'FACILITY' | 'CORRIDOR';
  entity_id: string;
  disruption_type: 'SHUTDOWN' | 'CAPACITY_REDUCTION' | 'PORT_CLOSURE' | 'LEAD_TIME_SURGE';
  start_day: number;
  duration_days: number;
  capacity_reduction_pct: number;
  extra_lead_time_days: number;
  notes?: string;
}

export interface DisruptionScenario {
  id: string;
  name: string;
  description?: string;
  horizon_days: number;
  status: string;
  created_at: string;
  events: DisruptionEvent[];
}

export interface DailySimulationMetric {
  day: number;
  baseline_production: number;
  actual_production: number;
  units_lost: number;
  accumulated_backlog: number;
  active_disruptions_count: number;
  daily_financial_loss: number;
  cumulative_financial_loss: number;
}

export interface ProductSimulationImpact {
  product_id: string;
  product_name: string;
  units_demanded: number;
  units_produced: number;
  units_short: number;
  total_revenue_loss: number;
  stockout_day?: number | null;
}

export interface SimulationRun {
  id: string;
  scenario_id: string;
  name: string;
  status: string;
  total_revenue_loss: number;
  total_units_lost: number;
  max_delay_days: number;
  stockout_day?: number | null;
  resilience_score: number;
  run_summary?: string;
  metadata_json?: any;
  executed_at: string;
  daily_metrics: DailySimulationMetric[];
  product_impacts: ProductSimulationImpact[];
}

export interface MitigationPlan {
  id: string;
  simulation_run_id: string;
  strategy_name: string;
  strategy_type: string;
  description?: string;
  additional_procurement_cost: number;
  additional_logistics_cost: number;
  units_recovered: number;
  avoided_revenue_loss: number;
  net_financial_benefit: number;
  recovery_days_saved: number;
  feasibility_score: number;
  status: 'DRAFT' | 'SUBMITTED_FOR_APPROVAL' | 'APPROVED' | 'REJECTED';
  parameters_json?: any;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  mitigation_plan_id: string;
  scenario_id?: string;
  simulation_run_id?: string;
  title: string;
  recommendation_summary: string;
  requested_by_id: string;
  requested_by_name?: string;
  reviewed_by_id?: string;
  reviewed_by_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  comments?: string;
  created_at: string;
  decided_at?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  user_email: string;
  details?: any;
  timestamp: string;
}

export interface CriticalSupplierReport {
  supplier_id: string;
  name: string;
  tier: string;
  country: string;
  downstream_impact_count: number;
  dependent_facilities: string[];
  betweenness_centrality: number;
  risk_score: number;
  is_spof: boolean;
  supplied_materials: string[];
}
