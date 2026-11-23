import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_workflow_end_to_end():
    # 1. Quick-start demo bootstrap
    qs_res = client.post("/api/v1/demo/quick-start")
    assert qs_res.status_code == 200
    creds = qs_res.json()["default_credentials"]

    # 2. Login
    login_res = client.post("/api/v1/auth/login", json=creds)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Supply Network Graph
    graph_res = client.get("/api/v1/network/graph", headers=headers)
    assert graph_res.status_code == 200
    assert graph_res.json()["total_nodes"] == 38
    assert graph_res.json()["spof_count"] >= 1

    # 4. Criticality
    crit_res = client.get("/api/v1/network/criticality", headers=headers)
    assert crit_res.status_code == 200
    assert len(crit_res.json()) >= 1

    # 5. Scenarios
    scen_res = client.get("/api/v1/scenarios", headers=headers)
    assert scen_res.status_code == 200
    assert len(scen_res.json()) >= 1
    scen_id = scen_res.json()[0]["id"]

    # 6. Execute Deterministic Simulation
    sim_res = client.post("/api/v1/simulations/run", json={"scenario_id": scen_id}, headers=headers)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert "total_revenue_loss" in sim_data
    assert "resilience_score" in sim_data
    assert len(sim_data["daily_metrics"]) > 0

    # 7. Mitigation Optimization
    mit_res = client.post("/api/v1/mitigations/optimize", json={
        "simulation_run_id": sim_data["id"],
        "optimization_objective": "BALANCED"
    }, headers=headers)
    assert mit_res.status_code == 200
    assert len(mit_res.json()) >= 1

    # 8. LangGraph Multi-Agent Investigation
    agent_res = client.post("/api/v1/agents/investigate", json={"scenario_id": scen_id}, headers=headers)
    assert agent_res.status_code == 200
    agent_data = agent_res.json()
    assert agent_data["status"] == "COMPLETED"
    assert len(agent_data["traces"]) == 6 # All 6 specialized agents executed!
    assert "executive_summary" in agent_data

    # 9. PDF Generation Endpoint
    pdf_res = client.get(f"/api/v1/reports/pdf/{sim_data['id']}", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000 # Verified PDF binary payload
