from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
login_res = client.post('/api/v1/auth/login', json={'email': 'executive@apex-nexus.com', 'password': 'NexusEnterprise2026!'})
print("Login status:", login_res.status_code)
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

res = client.get('/api/v1/network/graph', headers=headers)
print("Graph status:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print("Nodes:", len(data.get("nodes", [])))
    print("Edges:", len(data.get("edges", [])))
    print("SPOF count:", data.get("spof_count"))
    print("Sample Node:", data.get("nodes", [])[0] if data.get("nodes") else None)
    print("Sample Edge:", data.get("edges", [])[0] if data.get("edges") else None)
else:
    print("Error:", res.text)
