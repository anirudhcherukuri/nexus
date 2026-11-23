from typing import Dict, List, Any, Optional
from typing_extensions import TypedDict

class AgentInvestigationState(TypedDict):
    """Strictly typed state schema for the NEXUS LangGraph agent team."""
    organization_id: str
    scenario_id: Optional[str]
    user_prompt: Optional[str]
    
    # Agent 1: Scenario Analyst
    parsed_scenario_params: Dict[str, Any]
    is_scenario_valid: bool
    scenario_validation_errors: List[str]

    # Agent 2: Network Investigator
    affected_entities: List[Dict[str, Any]]
    downstream_impacted_facilities: List[str]
    identified_spofs: List[str]

    # Agent 3: Simulation Orchestrator
    simulation_id: Optional[str]
    deterministic_metrics: Dict[str, Any]
    simulation_verified: bool

    # Agent 4: Mitigation Strategist
    evaluated_mitigations: List[Dict[str, Any]]
    recommended_mitigation_id: Optional[str]

    # Agent 5: Risk Analyst
    residual_risks: List[str]
    unverified_assumptions: List[str]

    # Agent 6: Executive Reporter
    executive_summary: str
    key_findings: List[str]
    actionable_recommendations: List[str]
    approval_request_id: Optional[str]

    # Traces and audit
    step_traces: List[Dict[str, Any]]
    current_step: str
    execution_status: str
