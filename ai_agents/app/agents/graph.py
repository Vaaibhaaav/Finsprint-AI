import os
import datetime
import asyncio
from typing import List, Dict, Optional, Literal
from dotenv import load_dotenv
from typing_extensions import TypedDict
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage, ToolMessage, AIMessage, SystemMessage
from langchain_core.documents import Document
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph

from app.agents.cards import run_reward_optimiser
from app.agents.insights import run_insights_agent
from app.agents.live_research import run_conversational_agent, fetch_live_indian_market_data

load_dotenv()

class AgentState(TypedDict):
    messages: List[BaseMessage]
    transactions: List[Dict]
    user_profile: Dict
    retrieved_docs: List[Document]
    card_data: List[Dict]
    live_results: List[Dict]
    anomalies: List[Dict]
    insights: str
    current_agent: str
    error: Optional[str]


class RouterSchema(BaseModel):
    """Classify the user's financial query to route it to the correct specialized agent."""
    next_agent: Literal["insights", "card_optimizer", "live_research"] = Field(
        description="Choose 'card_optimizer' for rewards, card comparisons, or card recommendations. "
                    "Choose 'live_research' for real-time market offers, deals, or new card launches. "
                    "Choose 'insights' for general chat, transaction leaks, duplicates, or anomaly tracking."
    )


def route_intent(state: AgentState) -> str:
    """Uses a structured LLM call to dynamically route the query based on semantic understanding."""
    last_message = state["messages"][-1].content if state["messages"] else ""
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.01,api_key=os.getenv("GROQ_API_KEY"))
    structured_llm = llm.with_structured_output(RouterSchema)
    try:
        decision = structured_llm.invoke(
            f"Analyze this user query and determine the best financial agent to handle it:\n\n'{last_message}'"
        )
        return decision.next_agent
    except Exception as e:
        print(f"Error during routing: {e}")
        return "insights"


def insights_node(state: AgentState) -> dict:
    """
    Graph adapter node for the Insights engine.
    Extracts transactions from the state and forwards them to our core runner.
    """
    raw_txns = state.get("transactions", [])

    class TransactionObject:
        def __init__(self, d):
            self.merchant_name = d.get('merchant_clean', d.get('merchant', d.get('Merchant', 'Unknown')))
            self.amount = float(d.get('debit', d.get('Amount', 0)))
            self.category = d.get('category', d.get('Category', 'shopping'))
            date_str = d.get('date', '')
            try:
                self.date = datetime.datetime.strptime(date_str, "%Y-%m-%d")
            except Exception:
                self.date = datetime.datetime.now()

    mapped_transactions = [TransactionObject(t) for t in raw_txns]
    api_key = os.environ.get("GEMINI_API_KEY", "")

    enriched_anomalies = run_insights_agent(
        transactions=mapped_transactions,
        api_key=api_key,
        model_id="gemini-2.5-flash"
    )

    return {
        "anomalies": enriched_anomalies,
        "insights": f"Analysis complete. Found {len(enriched_anomalies)} items needing attention.",
        "current_agent": "insights"
    }


import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


async def card_optimizer_node(state: AgentState) -> dict:
    logging.info("\n==================================================")
    logging.info("[NODE ENTRY] Executing card_optimizer_node...")

    raw_txns = state.get("transactions", [])
    user_profile = state.get("user_profile", {})
    user_preferences_input = user_profile.get("custom_preferences_line", "")

    logging.info(f"[NODE INPUT] Received {len(raw_txns)} raw transactions from state channels.")
    logging.info(f"[NODE INPUT] User Preference input prompt: '{user_preferences_input}'")

    class TransactionAdapter:
        def __init__(self, item):
            self.merchant_name = item.get('merchant_clean', item.get('merchant', item.get('Merchant', 'Unknown')))
            self.amount = float(item.get('debit', item.get('Amount', 0)))
            self.category = item.get('category', item.get('Category', 'shopping'))
            date_str = item.get('date', '')
            try:
                self.date = datetime.datetime.strptime(date_str, "%Y-%m-%d")
            except Exception:
                self.date = datetime.datetime.now()

    logging.info("[ADAPTER PIPELINE] Transforming input transaction array map via TransactionAdapter...")
    try:
        adapted_transactions = [TransactionAdapter(t) for t in raw_txns]
        if adapted_transactions:
            sample = adapted_transactions[0]
            logging.info(
                f"[ADAPTER SUCCESS] Sample adapted txn -> Merchant: '{sample.merchant_name}', Amount: {sample.amount}, Category: '{sample.category}'")
    except Exception as adapter_err:
        logging.error(f"[ADAPTER CRITICAL ERROR] Data adaptation failed internally: {adapter_err}")
        raise adapter_err

    api_key = os.environ.get("GEMINI_API_KEY", "")
    logging.info(f"[ENV CHECK] Gemini API Key present in OS environment: {bool(api_key)}")

    try:
        logging.info("[ENGINE CALL] Dispatching adapted data to run_reward_optimiser using gemini-2.5-flash...")
        optimization_payload = await run_reward_optimiser(
            transactions=adapted_transactions,
            api_key=api_key,
            preferences_text=user_preferences_input,
            model_id="gemini-2.5-flash",
            statement_months=1,
        )

        logging.info(f"[ENGINE RESPONSE] Optimization execution complete. Data type: {type(optimization_payload)}")
        logging.info(f"[ENGINE RESPONSE] Raw output string representation: {str(optimization_payload)[:500]}...")

        if optimization_payload:
            metrics = optimization_payload[0]
            logging.info(f"[PARSING LOGIC] metrics object extracted from index 0. Type: {type(metrics)}")
            logging.info(
                f"[PARSING LOGIC] Keys found in metrics dictionary: {list(metrics.keys()) if isinstance(metrics, dict) else 'NOT A DICTIONARY'}")

            all_recommended_cards = []

            top_pick = metrics.get("top_pick")
            logging.info(f"[PARSING LOGIC] 'top_pick' type: {type(top_pick)} | Content: {top_pick}")
            if isinstance(top_pick, dict):
                all_recommended_cards.append(top_pick)
                logging.info("[PARSING LOGIC] Successfully appended 'top_pick' dictionary.")

            runner_ups = metrics.get("runner_ups")
            logging.info(
                f"[PARSING LOGIC] 'runner_ups' type: {type(runner_ups)} | Length: {len(runner_ups) if isinstance(runner_ups, list) else 'N/A'}")
            if isinstance(runner_ups, list):
                all_recommended_cards.extend(runner_ups)
                logging.info(f"[PARSING LOGIC] Successfully extended array list with {len(runner_ups)} runner-ups.")

            outbound_node_payload = {
                "card_data": all_recommended_cards,
                "insights": metrics.get("summary", "Optimization completed."),
                "current_agent": "card_optimizer"
            }

            logging.info(
                f"[NODE EXIT] Returning structured data block. 'card_data' total element entries: {len(all_recommended_cards)}")
            logging.info("==================================================")
            return outbound_node_payload
        else:
            logging.warning("[NODE WARNING] optimization_payload evaluated to empty or None.")
            return {
                "current_agent": "card_optimizer",
                "error": "Optimization engine returned an empty payload."
            }

    except Exception as e:
        logging.error(f"[NODE PROCESSOR EXCEPTION] An error broke the execution loop. Traceback message: {e}",
                      exc_info=True)
        return {
            "current_agent": "card_optimizer",
            "error": "Optimization engine processing failed due to some error",
            "err": str(e)
        }

async def live_research_node(state: AgentState) -> dict:
    """
    Advanced Dynamic Conversational Graph Wrapper Node.
    Extracts transaction parameters, pulls goals schemas, references Mem0 indices,
    and handles dynamic dual-pass tool execution blocks automatically.
    """
    chat_history = state.get("messages", [])
    api_key = os.environ.get("GEMINI_API_KEY", "")

    user_profile = state.get("user_profile", {})
    passed_transactions = user_profile.get("active_financial_transactions", [])
    passed_goals = user_profile.get("active_financial_goals", [])
    user_uuid = user_profile.get("user_id", "default_finsprint_user")

    engine_output = await run_conversational_agent(
            messages=chat_history,
            user_id=user_uuid,
            api_key=api_key,
            transactions=passed_transactions,
            goals=passed_goals,
        )

    if engine_output["action"] == "demand_context":
        demand_msg = AIMessage(content=engine_output["message"])
        return {
            "messages": chat_history + [demand_msg],
            "insights": "Gating failure. System demanded context inputs.",
            "current_agent": "live_research"
        }

    response_message = engine_output["message"]

    if hasattr(response_message, "tool_calls") and response_message.tool_calls:
        updated_messages = chat_history + [response_message]

        for tool_call in response_message.tool_calls:
            tool_output = fetch_live_indian_market_data.invoke(tool_call["args"])

            tool_receipt = ToolMessage(
                content=tool_output,
                name=tool_call["name"],
                tool_call_id=tool_call["id"]
            )
            updated_messages.append(tool_receipt)

        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-002", google_api_key=api_key, temperature=0.0)

        final_synthesis = llm.invoke(
            [SystemMessage(
                content="Synthesize the tool data findings elegantly. Make sure to cross-reference their financial goals explicitly.")]
            + updated_messages
        )

        return {
            "messages": updated_messages + [final_synthesis],
            "insights": final_synthesis.content,
            "current_agent": "live_research"
        }

    return {
        "messages": chat_history + [response_message],
        "insights": response_message.content,
        "current_agent": "live_research"
    }



workflow = StateGraph(AgentState)

workflow.add_node("insights", insights_node)
workflow.add_node("card_optimizer", card_optimizer_node)
workflow.add_node("live_research", live_research_node)

workflow.set_conditional_entry_point(
    route_intent,
    {
        "insights": "insights",
        "card_optimizer": "card_optimizer",
        "live_research": "live_research"
    }
)

workflow.add_edge("insights", END)
workflow.add_edge("card_optimizer", END)
workflow.add_edge("live_research", END)

app_graph = workflow.compile()