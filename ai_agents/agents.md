"I am working on FinSprint. Here is the exact architectural and implementation snapshot of the project right now. Read it, adopt the design constraints, and wait for my instruction on what component we are coding next."*

# FinSprint AI - Core Agents Architecture

## 1. Global Technical Stack (2026 Ecosystem)
* [cite_start]**Primary Language Environment:** Python (`ai-service/` via `uv` package manager) [cite: 15, 103]
* **Database Infrastructure:** Neon DB (Serverless Cloud PostgreSQL) for structured schema rows
* [cite_start]**Vector Architecture:** Local Embedded ChromaDB via `sentence-transformers` (`all-MiniLM-L6-v2`) [cite: 15, 47, 52]
* [cite_start]**Primary LLM Engine:** Gemini 1.5/2.0 Flash (`gemini-1.5-flash-002` via Google AI Studio) [cite: 62, 65]
* [cite_start]**Fallback LLM Engine:** Groq API Cloud (`llama3-3-70b-versatile` via console.groq.com) [cite: 62, 65, 106]

## 2. Hard Coding Patterns & Constraints
* **The Adapter Pattern:** * Core agent brains must be built as pure, isolated Python functions or classes (e.g., `run_insights_agent`). They take standard datatypes and return structured dictionaries/lists.
  * The file `graph.py` acts strictly as an configuration layer. It wraps these pure functions inside local graph-node definitions (e.g., `insights_node`), maps the `AgentState` data, and feeds outputs back into the graph memory.
* **Phase Decoupling:** Engines must strictly separate calculation math from narration:
  1. [cite_start]Phase 1: Run native deterministic calculations (Python data-structures / Pandas). [cite: 35, 45, 75]
  2. [cite_start]Phase 2: Send structured list payloads to LLMs for text-property enrichment only. [cite: 35, 45, 75]
* **Isolation of Budgeting:** Zero financial forecasting or budgeting math logic is permitted in Python files. All budget tasks belong strictly inside the Go server components.

## 3. Agent Specifications & Signatures

### Agent 01: Guardian Insights
* **File Location:** `ai-service/app/agents/insights.py`
* **Core Routine:** `run_insights_agent(transactions: list, api_key: str, provider: str, model_id: str) -> list[dict]`
* **Graph Adapter:** Defined inside `graph.py` as `insights_node(state: AgentState)`. Maps graph state list records to runtime object attributes, executes the core routine, and updates state tables.

### Agent 02: Reward Optimizer 
* **File Location:** `ai-service/app/agents/cards.py`
* [cite_start]**Core Routine:** RAG matching over ~150 Indian credit card parameters stored locally inside ChromaDB collections. [cite: 38, 50]
* ### Database Routing Constraints
* **Mathematical Operations:** Must strictly read parameters from structured files (`indian_cards.json`) or relational tables (Neon DB) to maintain complete numerical accuracy and prevent parsing exceptions.
* **Semantic Operations:** Vector search records inside local ChromaDB instances are reserved exclusively for providing context to conversational chat agent interactions.
### Agent 03: Live Research Gated Agent Architecture
* **File Directory target:** `ai-service/app/agents/research.py`
* **Infrastructure Layer Added:** Mem0 Open-Source Core (Asynchronous text trait extraction loop).
* **System Gating Constraints:** 
  * If a user initiates context-heavy search intents while `transactions` or `goals` payloads are unpopulated, the engine returns an absolute context demand message and halts downstream execution blocks.
  * Active queries blend historical user context memories from Mem0 with dynamic real-world insights via Upstash Redis tool caching layers.

## 7. Unified Object Model Alignments
* **Database Property Mappings:** User Profile registration variables use explicit capitalized properties (`ID`, `Amount`, `Merchant`, `Deadline`). 
* **Adapter Logic Transformers:** Node end routes dynamically normalize case property variants before triggering mathematical algorithms to isolate dependencies cleanly.