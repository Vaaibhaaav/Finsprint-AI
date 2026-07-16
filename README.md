# 🚀 FinSprint: AI-Driven Financial Intelligence Ecosystem

FinSprint is a highly scalable, enterprise-grade wealth optimization and financial intelligence engine. The platform splits workloads between a hyper-fast **Go (Gin)** microservice core handling multi-tenant transactional accounts and an **Asynchronous Python (FastAPI)** backend driving an agentic **LangGraph** AI loop. 

FinSprint parses structural transaction behavior alongside user lifestyle preferences to automatically detect anomalies, maximize credit card reward yields, and execute live market research.

---

## 🛠️ System Architecture & Data Flow

FinSprint implements a **Decoupled Gateway-to-Agent Architecture**. This design separates fast, predictable REST operations from heavy, non-deterministic machine learning compilation loops.

┌────────────────┐              ┌────────────────┐              ┌─────────────────┐
│                │  JSON (JWT)  │   Go Backend   │  Internal    │ Python Backend  │
│  Next.js UI    ├─────────────►│  (Gin Engine)  ├─────────────►│  (FastAPI / AI) │
│  Zustand Store │              │                │  Transit DTO │                 │
└────────────────┘              └───────┬────────┘              └────────┬────────┘
│                                │
🚀 GORM  │                                │ 🤖 LangGraph
▼                                ▼
┌───────────────┐               ┌────────────────┐
│   Neon DB     │               │   Google AI    │
│ (PostgreSQL)  │               │ (Gemini Flash) │
└───────────────┘               └────────────────┘


### 🛡️ Production Design Safeguards
* **Transit Data DTO Decoupling:** Uses explicit transit structures (`TransitUserProfile`) rather than raw database models over the wire. This insulates database schemas and converts strict engine types (like Postgres `time.Time` formats) into standard `RFC3339` strings, completely eliminating structural serialization panics.
* **Asynchronous Multi-Agent Runtime:** Network workflows are engineered using native `async def` and `await` hooks driven by LangGraph's `.ainvoke()` loop, ensuring zero thread-blocking deadlocks during heavy calculations.
* **Resilient Schema Mappings:** Python interfaces use explicit Pydantic schemas to ingest Go's upper camel-case JSON fields into standard snake-case variables seamlessly.

---

## ✨ Core Features

### 💳 1. Intelligent Card Reward Optimizer
* **Dynamic Velocity Profiling:** Automatically groups debit vectors by categories, tracking overall transaction velocity and isolating high-impact spend items.
* **Deterministic Scoring Matrix:** Ranks matching cards dynamically from a custom structural knowledge database, adjusting for category limits, spending thresholds, and real-time custom user preferences (e.g., matching a prompt for *"premium lounge access"* to boost travel card weights).
* **LLM Real-World Enrichment:** Translates numerical reward calculations into high-end, tangible lifestyle value narratives powered by Gemini (e.g., turning "4,000 points" into *"2 complimentary nights at luxury airport stay over-lounges"*).

### 🏦 2. Automated Bank Statement Insights
* **Streaming Byte Ingestion:** Converts frontend documents to Base64 data slices, moving traffic through the Go transit boundary securely.
* **Structural Anomaly Engines:** Evaluates historical trends to catch duplicate merchant charges, hidden rate spikes, unrecognized subscription triggers, and velocity outliers.

### 🔍 3. Live Contextual Research Agent
* **Context-Aware Memory Matrix:** Pairs incoming chat history arrays with active state workflows to preserve long-term conversation context.
* **Real-Time Market Synthesis:** Spawns live search workers to verify real-time credit card benefit changes, market offers, and reward tier adjustments.

---

## 💻 Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Go Engine** | Go (v1.22+), Gin Gonic, GORM, Go-JWT, PostgreSQL Driver |
| **AI Subsystem** | Python (v3.13+), FastAPI, LangGraph, LangChain Core, Pydantic v2 |
| **Models & Compute**| Google Gemini 2.5 Flash, Asyncio Engine Loop |
| **Database** | Serverless PostgreSQL (Neon DB), Redis Cache |
| **Frontend UI** | Next.js, React, TypeScript, Zustand Global Store, Tailwind CSS |

---

## 📡 API Endpoint Mapping

### Go Gateway Router Layers (Public-Facing)
| HTTP Method | Route Endpoint Path | Access Type | Internal Pipeline Route Target |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/insights` | Protected (JWT) | Dispatches base64 banking statements to Python |
| `POST` | `/api/v1/ai/card_optimizer` | Protected (JWT) | Invokes state matrix calculations for card suggestions |
| `POST` | `/api/v1/ai/research` | Protected (JWT) | Routes user prompts downstream to the Live Research agent |

### Python Private Agent Endpoints (Internal Microservice)
| HTTP Method | Route Endpoint Path | Processing Mode | State Handler / Graph Node Target |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/agent/insights` | Asynchronous | `insights_node` |
| `POST` | `/api/v1/agent/card_optimizer` | Asynchronous | `card_optimizer_node` |
| `POST` | `/api/v1/agent/research` | Asynchronous | `live_research_node` |

---

## 🚦 Getting Started & Installation

### 1. Set Up the Python AI Microservice
```bash
# Navigate to agent workspace
cd ai_agents

# Create and activate environment loop
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure secret context keys
export GEMINI_API_KEY="your_google_gemini_api_key"

# Launch async Uvicorn service on port 8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
