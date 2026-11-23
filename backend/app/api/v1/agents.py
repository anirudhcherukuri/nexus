import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scenario import DisruptionScenario
from app.api.deps import get_current_org_id, get_current_user
from app.models.user import User
from app.agents.graph import NexusMultiAgentOrchestrator
from app.schemas.agents import AgentInvestigateRequest, AgentInvestigationResult, AgentStepTrace

router = APIRouter(prefix="/agents", tags=["Agentic AI"])

@router.post("/investigate", response_model=AgentInvestigationResult)
def run_agent_investigation(
    payload: AgentInvestigateRequest,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user)
):
    # If no scenario_id provided, pick the latest or first scenario
    scenario_id = payload.scenario_id
    if not scenario_id:
        latest = db.query(DisruptionScenario).filter(DisruptionScenario.organization_id == org_id).order_by(DisruptionScenario.created_at.desc()).first()
        if not latest:
            raise HTTPException(status_code=400, detail="No disruption scenarios exist. Please seed demo data or create a scenario first.")
        scenario_id = latest.id

    orchestrator = NexusMultiAgentOrchestrator(
        db=db,
        organization_id=org_id,
        current_user_id=current_user.id
    )

    final_state = orchestrator.execute(scenario_id=scenario_id, prompt=payload.prompt or "")

    traces = [
        AgentStepTrace(
            agent_name=t["agent_name"],
            action_type=t["action_type"],
            input_data=t["input_data"],
            output_summary=t["output_summary"],
            citable_metrics=t["citable_metrics"],
            verified=t["verified"]
        )
        for t in final_state["step_traces"]
    ]

    return AgentInvestigationResult(
        execution_id=str(uuid.uuid4()),
        scenario_id=final_state["scenario_id"],
        simulation_id=final_state["simulation_id"],
        status=final_state["execution_status"],
        executive_summary=final_state["executive_summary"],
        key_findings=final_state["key_findings"],
        calculated_impacts=final_state["deterministic_metrics"],
        recommended_mitigations=final_state["evaluated_mitigations"],
        residual_risks=final_state["residual_risks"],
        unverified_assumptions=final_state["unverified_assumptions"],
        traces=traces
    )
