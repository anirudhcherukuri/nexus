from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AgentInvestigateRequest(BaseModel):
    scenario_id: Optional[str] = None
    prompt: Optional[str] = None
    require_approval: bool = True

class AgentStepTrace(BaseModel):
    agent_name: str
    action_type: str
    input_data: Dict[str, Any]
    output_summary: str
    citable_metrics: Dict[str, Any] = {}
    verified: bool = True

class AgentInvestigationResult(BaseModel):
    execution_id: str
    scenario_id: Optional[str]
    simulation_id: Optional[str]
    status: str
    executive_summary: str
    key_findings: List[str]
    calculated_impacts: Dict[str, Any]
    recommended_mitigations: List[Dict[str, Any]]
    residual_risks: List[str]
    unverified_assumptions: List[str]
    traces: List[AgentStepTrace]
