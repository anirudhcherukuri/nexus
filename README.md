# NEXUS – AI Supply Network Intelligence & Disruption Simulator

NEXUS is an enterprise-grade multi-tenant B2B SaaS platform engineered for global manufacturers, automotive OEMs, aerospace contractors, pharmaceutical producers, and procurement executives to visualize multi-tier supply topologies, pinpoint single points of failure (SPOFs), simulate compounding disruptions, and orchestrate verifiable multi-agent AI mitigation plans governed by human approval.

---

## 1. Architectural Highlights

### Deterministic Core Principle
All numerical computations—including production delays, inventory runout timelines, capacity utilization, bill-of-materials explosion, backlog accumulation, and financial losses—are computed strictly by deterministic Python mathematical engines (NetworkX, SimPy, NumPy, Pandas, SciPy). Large Language Models (LLMs) **never fabricate financial metrics, inventory counts, or operational parameters**.

### Verifiable Agentic AI (LangGraph)
AI agents act as strategic co-pilots that interpret deterministic simulation runs, optimize mitigation trade-offs, and generate executive briefings. Every metric cited by an AI agent references verified simulation IDs and immutable metric hashes.

### Enterprise Multi-Tenancy & RBAC
Strict database isolation partitioned by `organization_id` on every query, model relationship, scenario, and simulation artifact. Granular role-based access control (RBAC) spans six roles:
1. `SuperAdmin`
2. `OrgAdmin`
3. `SupplyChainManager`
4. `ProcurementManager`
5. `OperationsAnalyst`
6. `Executive`

### Synthetic Demo Dataset
Pre-configured with **Apex Manufacturing Group** (Automotive & Industrial Components):
- 30 Suppliers across Tier 3 (Raw Materials), Tier 2 (Components), and Tier 1 (Direct Modules)
- 5 Manufacturing Plants and 3 Regional Logistics Hubs
- 20 Finished Product Assemblies
- 40 Materials and complete multi-level Bills of Materials (BOM)
- Pre-configured stress test scenarios with 1-click execution

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn-inspired components, React Flow (`@xyflow/react`), Recharts, TanStack Query, React Router v6.
- **Backend**: FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Python-Jose (JWT with HS256), Passlib (Bcrypt).
- **Simulation Core**: NetworkX (Graph topology, betweenness centrality, bottlenecks), SimPy & Pandas (Discrete-time multi-echelon simulation), NumPy & SciPy (Mitigation optimization).
- **AI Orchestration**: LangGraph-compatible stateful multi-agent execution pipeline.
- **Reporting**: ReportLab (Publication-grade PDF generator) and CSV streaming.
- **Database**: PostgreSQL / SQLite (zero-config local dev), Redis.
- **Infrastructure**: Docker, Docker Compose, Nginx.

---

## 3. Directory Layout

```
nexus/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI bootstrap & lifespan
│   │   ├── config.py                # Environment configurations
│   │   ├── database.py              # SQLAlchemy engine & session
│   │   ├── models/                  # Declarative ORM models
│   │   ├── schemas/                 # Pydantic v2 validation schemas
│   │   ├── api/v1/                  # REST API routers
│   │   ├── engine/                  # Deterministic simulation & graph core
│   │   ├── agents/                  # LangGraph multi-agent architecture
│   │   └── services/                # PDF & audit services
│   ├── tests/                       # Pytest test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                     # Axios HTTP client with JWT interceptor
│   │   ├── components/              # Layout, UI, Canvas, and Charts
│   │   ├── contexts/                # AuthContext with 1-click demo login
│   │   ├── pages/                   # 12 Enterprise pages
│   │   └── types/                   # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docs/
│   └── ARCHITECTURE.md              # Complete architectural blueprint
├── docker-compose.yml
└── README.md
```

---

## 4. Quickstart: Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Docker (optional for containerized deployment)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
The backend initializes SQLite database `nexus.db` and auto-bootstraps the **Apex Manufacturing Group** dataset on first run.
Interactive API documentation is accessible at: `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Immediate Demo Access
On the login screen (`/login`), click **"One-Click Demo Launch"** to enter the system immediately as **Sarah Jenkins (VP Supply Chain)**.
Credentials:
- Email: `executive@apex-nexus.com`
- Password: `NexusEnterprise2026!`

---

## 5. Running with Docker Compose

To deploy the entire production stack (PostgreSQL, Redis, FastAPI Backend, Nginx Frontend):
```bash
docker compose up --build -d
```
The web dashboard will be available at `http://localhost:3000` and API gateway at `http://localhost:8000`.

---

## 6. Running Test Suites

Run backend tests verifying simulation determinism, topological SPOF detection, and tenant isolation:
```bash
cd backend
export PYTHONPATH=.
pytest tests/ -v
```
All tests execute deterministically against reproducible seeds.
