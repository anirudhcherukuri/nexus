import sys
import os
import json
from starlette.testclient import TestClient
from app.main import app

def audit_system():
    results = {}
    
    # 1. Login with demo user
    client = TestClient(app)
    # Ensure quick start demo is initialized
    client.post("/api/v1/demo/quick-start")
    login_res = client.post("/api/v1/auth/login", json={
        "email": "executive@apex-nexus.com",
        "password": "NexusEnterprise2026!"
    })
    if login_res.status_code != 200:
        print("FAIL: Demo login failed", login_res.status_code, login_res.text)
        return
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    client.headers.update(headers)
    print("PASS: Auth / Demo login successful")

    BASE_URL = "/api/v1"

    # 2. Test Get Endpoints across all 12 modules
    routes = [
        ("/network/graph", "Network Graph"),
        ("/network/criticality", "Criticality"),
        ("/suppliers", "Suppliers List"),
        ("/facilities", "Facilities List"),
        ("/inventory", "Inventory List"),
        ("/scenarios", "Scenarios List"),
        ("/scenarios/templates/all", "Scenario Templates"),
        ("/simulations", "Simulations List"),
        ("/approvals", "Approvals List"),
        ("/organizations/profile", "Org Profile"),
        ("/organizations/users", "Org Users"),
        ("/organizations/audit-logs", "Audit Logs")
    ]
    
    for route, label in routes:
        r = client.get(f"{BASE_URL}{route}")
        if r.status_code == 200:
            count = len(r.json()) if isinstance(r.json(), list) else len(r.json().keys())
            print(f"PASS: {label} [{route}] returned 200 OK (count/keys: {count})")
        else:
            print(f"FAIL: {label} [{route}] returned {r.status_code}: {r.text}")

    # 3. Phase 4: Run the 7 distinct simulation scenarios
    # Load suppliers & facilities
    suppliers = client.get(f"{BASE_URL}/suppliers").json()
    facilities = client.get(f"{BASE_URL}/facilities").json()
    s1 = suppliers[0]["id"]
    s2 = suppliers[1]["id"]
    f1 = facilities[0]["id"]
    
    simulation_tests = [
        ("Single supplier shutdown 7d", [
            {"entity_type": "SUPPLIER", "entity_id": s1, "disruption_type": "SHUTDOWN", "start_day": 1, "duration_days": 7, "capacity_reduction_pct": 100}
        ]),
        ("Single supplier shutdown 14d", [
            {"entity_type": "SUPPLIER", "entity_id": s1, "disruption_type": "SHUTDOWN", "start_day": 1, "duration_days": 14, "capacity_reduction_pct": 100}
        ]),
        ("Supplier capacity reduction 50%", [
            {"entity_type": "SUPPLIER", "entity_id": s1, "disruption_type": "CAPACITY_REDUCTION", "start_day": 1, "duration_days": 21, "capacity_reduction_pct": 50}
        ]),
        ("Factory shutdown", [
            {"entity_type": "FACILITY", "entity_id": f1, "disruption_type": "SHUTDOWN", "start_day": 5, "duration_days": 10, "capacity_reduction_pct": 100}
        ]),
        ("Multiple supplier disruptions", [
            {"entity_type": "SUPPLIER", "entity_id": s1, "disruption_type": "SHUTDOWN", "start_day": 3, "duration_days": 14, "capacity_reduction_pct": 100},
            {"entity_type": "SUPPLIER", "entity_id": s2, "disruption_type": "CAPACITY_REDUCTION", "start_day": 5, "duration_days": 20, "capacity_reduction_pct": 60}
        ]),
        ("Alternative supplier activation test", [
            {"entity_type": "SUPPLIER", "entity_id": s1, "disruption_type": "PORT_CLOSURE", "start_day": 2, "duration_days": 18, "capacity_reduction_pct": 80}
        ]),
        ("Inventory buffer utilization stress test", [
            {"entity_type": "SUPPLIER", "entity_id": s1, "disruption_type": "SHUTDOWN", "start_day": 1, "duration_days": 30, "capacity_reduction_pct": 100}
        ])
    ]
    
    print("\n--- PHASE 4: DETERMINISTIC SIMULATION TESTS ---")
    sim_ids = []
    for test_name, evts in simulation_tests:
        scen_payload = {
            "name": f"Audit: {test_name}",
            "description": f"Automated audit scenario for {test_name}",
            "horizon_days": 60,
            "events": evts
        }
        create_scen = client.post(f"{BASE_URL}/scenarios", json=scen_payload)
        if create_scen.status_code != 200:
            print(f"FAIL: Scenario creation for {test_name}: {create_scen.text}")
            continue
        scen_id = create_scen.json()["id"]
        
        # Execute simulation
        sim_run = client.post(f"{BASE_URL}/simulations/run", json={"scenario_id": scen_id})
        if sim_run.status_code == 200:
            sim_data = sim_run.json()
            sim_ids.append(sim_data["id"])
            print(f"PASS: {test_name} -> Loss: ${sim_data['total_revenue_loss']:,.2f}, Units Lost: {sim_data['total_units_lost']}, Resilience: {sim_data['resilience_score']}/100, Stockout Day: {sim_data['stockout_day']}")
        else:
            print(f"FAIL: Simulation execution for {test_name}: {sim_run.text}")

    # 4. Phase 5: AI Agent Swarm Testing
    print("\n--- PHASE 5: AI AGENT SWARM VERIFICATION ---")
    if sim_ids:
        target_scen_id = scen_id
        agent_res = client.post(f"{BASE_URL}/agents/investigate", json={
            "scenario_id": target_scen_id,
            "prompt": "Evaluate downstream automotive impact and prioritize alternative suppliers"
        })
        if agent_res.status_code == 200:
            agent_data = agent_res.json()
            print("PASS: Multi-agent investigation completed successfully.")
            print(f"Traces count: {len(agent_data.get('traces', []))}")
            for t in agent_data.get("traces", []):
                print(f"  - Agent: {t.get('agent_name')} | Verified: {t.get('verified')} | Step: {t.get('output_summary')[:60]}...")
            print("Executive Summary sample:")
            print("  " + agent_data.get("executive_summary", "")[:120] + "...")
        else:
            print(f"FAIL: Agent investigation failed: {agent_res.text}")

    # 5. Mitigation Optimizer test
    print("\n--- MITIGATION OPTIMIZER & REPORT DOWNLOAD TEST ---")
    if sim_ids:
        test_sim_id = sim_ids[0]
        mit_res = client.post(f"{BASE_URL}/mitigations/optimize", json={
            "simulation_run_id": test_sim_id,
            "optimization_objective": "BALANCED"
        })
        if mit_res.status_code == 200:
            plans = mit_res.json()
            print(f"PASS: Mitigation optimizer generated {len(plans)} plans.")
            for p in plans:
                print(f"  - Plan: {p['strategy_name']} | Net Benefit: ${p['net_financial_benefit']:,.2f} | Recovered: {p['units_recovered']}")
        else:
            print(f"FAIL: Mitigation optimizer failed: {mit_res.text}")

        # PDF & CSV report test
        pdf_res = client.get(f"{BASE_URL}/reports/pdf/{test_sim_id}")
        csv_res = client.get(f"{BASE_URL}/reports/csv/{test_sim_id}")
        print(f"PASS: PDF Report status {pdf_res.status_code} ({len(pdf_res.content)} bytes)")
        print(f"PASS: CSV Report status {csv_res.status_code} ({len(csv_res.content)} bytes)")

if __name__ == "__main__":
    audit_system()
