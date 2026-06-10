from app.schema.schema import UserProfileSchema
import os
import base64
import logging
import datetime
from fastapi import FastAPI,HTTPException
from pydantic import BaseModel, Field
from typing import List,Dict,Optional

from app.agents.graph import app_graph
from app.schema.schema import UnifiedInboundPayload
from app.utils.parser import parse_bank_statement_bytes
from langchain_core.messages import BaseMessage, ToolMessage, AIMessage, SystemMessage,HumanMessage

logger = logging.getLogger(__name__)

app = FastAPI(
    title="FinSprint AI Orchestration Gateway",
    version="2026.1.0",
    description="Unified API entry gateway managing LangGraph microservice edges for the Go corporate server proxy layer."
)

@app.post("/api/v1/agent/insights")
async def process_statement_insights(payload : UnifiedInboundPayload):
    """
    Node 01 Gateway: Ingestion & Duplicate/Anomaly Tracking.
    Parses newly uploaded binary statements stream data for raw analytics.
    """
    logger.info(f"Received payload {payload}")
    if not payload.Transactions:
        raise HTTPException(
            status_code=400,
            detail="Insights node calculation requires a valid statement file parameter buffer."
        )

    try :
        decoded_bytes = base64.b64decode(payload.Transactions)
        logger.info(f"Decoded payload {payload}")
        parsed_statement_txns = parse_bank_statement_bytes(decoded_bytes)
        logger.info(f"Parsed payload {payload}")
        if not parsed_statement_txns:
            return {
                "status": "empty_file_fallback",
                "action_required": "none",
                "message": "Statement document contained zero valid numerical debit transaction rows.",
                "payload": {"anomalies": [], "insights": "No transaction footprints captured."}
            }

        initial_state = {
            "messages": [HumanMessage(content=payload.message or "Analyze statement transactions data")],
            "transactions": parsed_statement_txns,
            "user_profile": {
                "user_id": payload.user_profile.user.id,
                "custom_preferences_line": payload.message,
                "active_financial_goals": [g.dict() for g in payload.user_profile.goals],
                "active_financial_transactions": [t.dict() for t in payload.user_profile.transactions]
            }
        }

        execution_result = app_graph.invoke(initial_state)
        return {
            "status": "success",
            "action_required": "none",
            "message": "Statement file parsing anomalies analyzed successfully.",
            "payload": {
                "anomalies": execution_result.get("anomalies", []),
                "insights": execution_result.get("insights", "Anomalies lookup completed."),
                "card_data": [],
                "live_results": [],
                "error": None
            }
        }
    except Exception as e:
        logger.error(f"Insights controller runtime crash: {str(e)}")
        return {
            "status": "internal_error",
            "action_required": "retry_operation",
            "message": f"AI pipeline component exception: {str(e)}",
            "payload": None
        }

@app.post("/api/v1/agent/card_optimizer")
async def process_card_optimizer(payload: UnifiedInboundPayload):
    """
    Node 02 Gateway: Card Optimizer calculations via LangGraph.
    """
    import logging
    from langchain_core.messages import HumanMessage
    # Import your compiled graph instance here (e.g., from app.agents.graph import app_graph)

    logging.info("\n==================================================")
    logging.info("[CONTROLLER ENTRY] Invoking LangGraph for card optimization...")

    try:
        # 1. Initialize the global AgentState parameters matching your graph channels
        initial_state = {
            "messages": [HumanMessage(content=payload.message or "Optimize my credit card rewards")],
            "transactions": [t.dict() for t in payload.user_profile.transactions],
            "user_profile": {
                "user_id": payload.user_profile.user.id,
                "custom_preferences_line": payload.message,
            },
            "card_data": [],
            "insights": "",
            "anomalies": [],
            "live_results": []
        }

        logging.info("[LANGGRAPH CALL] Executing app_graph.invoke()...")

        # 2. Invoke your graph structure.
        # Note: If your graph compilation doesn't support async invoke natively yet,
        # use: execution_result = app_graph.invoke(initial_state)
        execution_result =await app_graph.ainvoke(initial_state)

        logging.info(
            f"[LANGGRAPH RESPONSE] Graph execution finished. State keys returned: {list(execution_result.keys())}")

        final_card_data = execution_result.get("card_data", [])
        final_insights = execution_result.get("insights", "Optimization completed successfully.")

        logging.info(f"[PARSING SUCCESS] Extracted {len(final_card_data)} cards from state graph.")

        return {
            "status": "success",
            "message": "Rewards optimized successfully via LangGraph pipeline.",
            "payload": {
                "card_data": final_card_data,  # This flat list array travels straight back to Go
                "insights": final_insights,
                "anomalies": [],
                "live_results": []
            }
        }

    except Exception as e:
        logging.error(f"[CONTROLLER CRITICAL ERROR] LangGraph invocation failed: {str(e)}", exc_info=True)
        return {
            "status": "internal_error",
            "message": f"AI card optimizer graph execution error: {str(e)}",
            "payload": None
        }

class ResearchRequestPayload(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    user_profile: UserProfileSchema

@app.post("/api/v1/agent/research")
async def process_live_research(payload: ResearchRequestPayload):
    """
    Node 03 Gateway: Live Research agent chatbot with Mem0 RAG and Tavily tool integration.
    """
    from app.agents.live_research import run_conversational_agent, fetch_live_indian_market_data
    from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
    from langchain_google_genai import ChatGoogleGenerativeAI

    api_key = os.environ.get("GEMINI_API_KEY", "")

    langchain_messages = []
    for msg in payload.history:
        if msg.get("role") == "assistant":
            langchain_messages.append(AIMessage(content=msg.get("content", "")))
        else:
            langchain_messages.append(HumanMessage(content=msg.get("content", "")))

    try:
        engine_output = await run_conversational_agent(
            messages=langchain_messages,
            user_id=payload.user_profile.user.id,
            api_key=api_key,
            transactions=[t.dict() for t in payload.user_profile.transactions],
            goals=[g.dict() for g in payload.user_profile.goals]
        )

        if engine_output.get("action") == "demand_context":
            return {
                "status": "gated_fallback",
                "message": engine_output.get("message"),
                "payload": None
            }

        response_message = engine_output.get("message")

        if hasattr(response_message, "tool_calls") and response_message.tool_calls:
            updated_messages = langchain_messages + [response_message]
            tool_results = []
            
            for tool_call in response_message.tool_calls:
                tool_output = fetch_live_indian_market_data.invoke(tool_call["args"])
                tool_receipt = ToolMessage(
                    content=tool_output,
                    name=tool_call["name"],
                    tool_call_id=tool_call["id"]
                )
                updated_messages.append(tool_receipt)
                
                # Mock structure details from tool queries to populate citation cards
                q = tool_call["args"].get("query", "deals")
                bank_name = "Indian Partner Bank"
                if "hdfc" in q.lower(): bank_name = "HDFC Bank"
                elif "sbi" in q.lower(): bank_name = "State Bank of India"
                elif "icici" in q.lower(): bank_name = "ICICI Bank"
                elif "amex" in q.lower(): bank_name = "American Express"
                
                tool_results.append({
                    "card_name": q.title() + " Offer",
                    "bank": bank_name,
                    "offer_or_deal": tool_output[:120].strip() + "...",
                    "source_url": "https://www.tavily.com"
                })

            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-002", google_api_key=api_key, temperature=0.0)
            final_synthesis = llm.invoke(
                [SystemMessage(content="Synthesize the tool data findings elegantly. Make sure to cross-reference their financial goals explicitly.")]
                + updated_messages
            )

            return {
                "status": "success",
                "message": final_synthesis.content,
                "payload": {
                    "live_results": tool_results
                }
            }

        return {
            "status": "success",
            "message": response_message.content,
            "payload": {
                "live_results": []
            }
        }
    except Exception as e:
        logger.error(f"Live research controller crash: {str(e)}")
        return {
            "status": "internal_error",
            "message": f"AI live research assistant error: {str(e)}",
            "payload": None
        }
