from typing import TypedDict
import os
import logging
import json
import torch
import numpy as np

from jinja2.utils import missing
from sympy.physics.units import temperature
from upstash_redis import Redis
from tavily import TavilyClient
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import tool
from sentence_transformers import SentenceTransformer, CrossEncoder

logger = logging.getLogger(__name__)

redis_client = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL", ""),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")
)

embedding_model = SentenceTransformer("BAAI/bge-large-en-v1.5")
reranker = CrossEncoder("mixedbread-ai/mxbai-rerank-large-v1")


def save_user_memory(user_id: str, text: str):
    """Generates an embedding locally and appends text + vector to Redis."""
    if not text.strip():
        return
    try:
        embedding = embedding_model.encode(text, convert_to_numpy=True).tolist()
        memory_payload = json.dumps({"text": text, "embedding": embedding})
        redis_client.rpush(f"finsprint:memory:{user_id}", memory_payload)
    except Exception as e:
        logger.error(f"Failed to commit local memory: {e}")


def retrieve_and_rerank_memories(user_id: str, query: str, top_k: int = 5) -> str:
    """Retrieves all memories, calculates cosine similarity locally, and reranks the top matches."""
    try:
        raw_memories = redis_client.lrange(f"finsprint:memory:{user_id}", 0, -1)
        if not raw_memories:
            return "No long term preferences preferred or required"

        query_vector = embedding_model.encode(query, convert_to_numpy=True)
        candidates = []

        for item in raw_memories:
            data = json.loads(item)
            mem_text = data["text"]
            mem_vector = np.array(data["embedding"])

            similarity = np.dot(query_vector, mem_vector) / (np.linalg.norm(query_vector) * np.linalg.norm(mem_vector))
            candidates.append((mem_text, similarity))

        candidates = sorted(candidates, key=lambda x: x[1], reverse=True)[:15]
        candidate_texts = [c[0] for c in candidates]

        if not candidate_texts:
            return "No long term preferences preferred or required"

        # Apply Cross-Encoder Reranking
        pairs = [[query, txt] for txt in candidate_texts]
        rerank_scores = reranker.predict(pairs)

        ranked_memories = sorted(zip(candidate_texts, rerank_scores), key=lambda x: x[1], reverse=True)
        top_selected = [m[0] for m in ranked_memories[:top_k]]

        return "\n".join([f"- {mem}" for mem in top_selected])
    except Exception as e:
        logger.warning(f"Error executing custom semantic memory pipeline: {e}")
        return "No long term preferences preferred or required"


@tool
def fetch_live_indian_market_data(query: str) -> str:
    """
    Queries the live web for real time credit card offers, bank deals,
    fee waivers or banking product launches in India for 2026
    """
    cache_key = f"finsprint:market_cache:{query.lower().strip()}"
    try:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            logger.info(f"Found cached data for query {query}")
            return cached_data
    except Exception as e:
        logger.error(f"Failed to get cached data for query {query} error : {e}")

    tavily_token = os.environ.get("TAVILY_API_KEY", "")
    if not tavily_token:
        return "Error : Tavily API key not set in .env file"

    try:
        tavily_client = TavilyClient(tavily_token)
        search_response = tavily_client.search(
            query=f"{query} credit card deals in India",
            max_results=3,
            topic="finance"
        )
        snippets = [r["content"] for r in search_response.get("results", [])]
        combined_results = "\n---\n".join(snippets)

        if not combined_results:
            return f"Error : No results found for query {query}"

        redis_client.set(cache_key, combined_results)
        return combined_results
    except Exception as e:
        return f"Live web scraping operations hit an error block : {str(e)}"


async def run_conversational_agent(
        messages: list,
        user_id: str,
        api_key: str,
        transactions: list[dict] = None,
        goals: list[dict] = None,
        model_id: str = "gemini-2.5-flash"
) -> dict:
    """
        Main Entry Point for the Advanced Conversational Agent.
        - Evaluates input criteria to demand missing structural payloads.
        - Synchronizes long-term personalization contexts via local embedding extraction.
        - Reranks extracted memories via local Cross-Encoder framework.
        - Binds web routing search tools via tool-calling architectures.
    """
    last_user_query = messages[-1].content if messages else ""

    context_heavy_intents = ["card", "offer", "deal", "target", "recommend", "optimize", "spend", "leak", "saving",
                             "goal"]
    requires_validation = any(keyword in last_user_query.lower() for keyword in context_heavy_intents)

    if requires_validation and (not transactions or not goals):
        missing_fields = []
        if not transactions: missing_fields.append("Transactions Payload Engine Data")
        if not goals: missing_fields.append("Goals Payload Engine Data")
        demand_response = (
            "⚠️ **FinSprint System Access Refused**\n\n"
            "You asked a context-heavy financial strategy question, but the application execution layer "
            f"did not supply the necessary data primitives. Missing items:\n"
            f"{', '.join([f'• **{f}**' for f in missing_fields])}\n\n"
            "Please upload your bank account statements, sync your parsing logs, or complete your active goals configuration dashboard "
            "so I can analyze your actual baseline financial behaviors before generating advice."
        )
        return {"action": "demand_context", "message": demand_response}

    # --- Long Term Memory Engine (Custom Local Search & Rerank) ---
    memories_summary = retrieve_and_rerank_memories(user_id, last_user_query)

    llm = ChatGoogleGenerativeAI(model=model_id, google_api_key=api_key, temperature=0.01)
    tools = [fetch_live_indian_market_data]
    llm_with_tools = llm.bind_tools(tools)

    system_instruction = SystemMessage(content=f"""You are FinSprint's flagship Live Research Intelligence Chatbot. 
    You provide high-end financial strategy recommendations matching the user's active life goals and actual transactional behaviors.

    LONG-TERM RECALLED USER PREFERENCES (VIA LOCAL EMBEDDINGS + RERANKER):
    {memories_summary}

    CURRENT HARD RUNTIME CONTEXTS PROVIDED:
    - Active Financial Goals Schema: {json.dumps(goals if goals else [])}
    - Target Transaction Indicators: Total of {len(transactions) if transactions else 0} verified transaction rows provided.

    CRITICAL EXECUTION LAWS:
    1. Direct Chat: For simple conversation choices (greetings, open chat), talk naturally. Do NOT run tools.
    2. Tool Injection: If the user asks about live interest rates, card promotions, waivers, or active launches in India, trigger 'fetch_live_indian_market_data'.
    3. Strict Tailoring: When answering, you MUST actively synthesize their explicit Goals and transaction indicators. Cross-reference their targets to make the final results incredibly targeted and hyper-specific.
    """)

    compiled_history = [system_instruction] + messages
    response_payload = llm_with_tools.invoke(compiled_history)

    # Save current interaction to local memory asynchronously / concurrently after execution
    if last_user_query.strip():
        save_user_memory(user_id, last_user_query)

    return {"action": "execute instruction", "message": response_payload}