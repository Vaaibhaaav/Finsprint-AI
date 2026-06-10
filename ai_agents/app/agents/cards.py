import json
import logging
import os
import re
import asyncio
import datetime
from pathlib import Path
from collections import defaultdict
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)

PARSER_TO_CARD_CATEGORY = {
    "food_dining": "dining",
    "groceries": "groceries",
    "streaming": "streaming",
    "entertainment": "entertainment",
    "travel": "travel",
    "fuel": "fuel",
    "shopping": "shopping",
    "health": "shopping",
    "subscription": "streaming",
    "other": "shopping",
}

NON_REWARDABLE_CATEGORIES = {
    "transfer",
    "emi_loan",
    "investment",
    "utilities",
    "insurance",
}

CARDS_JSON_PATH = Path(__file__).parent.parent / "information" / "cards_information" / "cards_information.json"


class ExtractedPreferences(BaseModel):
    boost_categories: list[str] = Field(
        default=[],
        description="Standardized reward categories to prioritize: 'dining', 'groceries', 'streaming', 'entertainment', 'travel', 'fuel', 'shopping'."
    )
    target_perks: list[str] = Field(
        default=[],
        description="Specific features, perks, or reward mechanisms the user desires (e.g., 'lounge', 'forex', 'cashback', 'rewards', 'milestones', 'movies')."
    )
    excluded_issuers: list[str] = Field(
        default=[],
        description="List of banking institutions or networks the user explicitly wants to avoid (e.g., 'HDFC', 'SBI', 'Amex')."
    )


def _load_cards_db() -> list:
    """Loads the core credit card parameter knowledge base."""
    logger.info(f"[CARDS DB] Attempting to read JSON database from: {CARDS_JSON_PATH}")
    try:
        with open(CARDS_JSON_PATH, "r") as f:
            data = json.load(f)
            logger.info(
                f"[CARDS DB SUCCESS] Successfully imported database data. Data Type: {type(data)} | Entries found: {len(data)}")
            return data
    except Exception as e:
        logger.error(f"[CARDS DB CRITICAL ERROR] Failed to load cards database from file: {e}", exc_info=True)
        return []


def build_spending_profile(transactions, statement_months: int = 1) -> list[dict]:
    """Groups debit transactions by category."""
    logger.info(
        f"[SPENDING PROFILE] Initializing spending profile aggregation for {len(transactions)} txns over {statement_months} months.")
    months = max(statement_months, 1)
    category_data = defaultdict(lambda: {"total": 0, "count": 0, "transactions": []})

    for idx, txn in enumerate(transactions):
        if txn.amount > 0 and txn.category not in NON_REWARDABLE_CATEGORIES:
            cat = txn.category
            category_data[cat]["total"] += txn.amount
            category_data[cat]["count"] += 1
            category_data[cat]["transactions"].append({
                "merchant": txn.merchant_name,
                "amount": round(txn.amount, 2),
                "date": txn.date.strftime("%Y-%m-%d"),
                "category": cat,
            })
        else:
            logger.debug(
                f"[SPENDING PROFILE] Skipping txn index {idx}: Amount={txn.amount}, Category='{txn.category}' (Non-rewardable or Credit)")

    result = []
    for cat, data in category_data.items():
        top_txns = sorted(data["transactions"], key=lambda x: x["amount"], reverse=True)[:5]
        result.append({
            "category": cat,
            "card_category": PARSER_TO_CARD_CATEGORY.get(cat, "shopping"),
            "total_spend": round(data["total"], 2),
            "monthly_spend": round(data["total"] / months, 2),
            "transaction_count": data["count"],
            "top_transactions": top_txns,
        })

    result.sort(key=lambda x: x["monthly_spend"], reverse=True)
    final_profile = result[:7]
    logger.info(f"[SPENDING PROFILE SUCCESS] Created {len(final_profile)} prominent spending velocity slices.")
    return final_profile


def score_all_cards(
    spending_profile: list[dict],
    cards_db: list,
    prefs: ExtractedPreferences
) -> list[dict]:

    logger.info(
        f"[SCORING PIPELINE] Starting evaluation of {len(cards_db)} cards."
    )

    scored = []

    for idx, card in enumerate(cards_db):

        card_name = card.get("name", f"Unknown Card #{idx}")
        issuer = card.get("issuer", "Unknown Issuer")
        card_id = card.get("id", f"card_index_{idx}")

        logger.info(
            f"\n{'=' * 60}\n"
            f"[CARD START] {card_name} | Issuer={issuer}"
        )

        issuer_lower = issuer.lower()

        if any(
            excluded.lower() in issuer_lower
            for excluded in prefs.excluded_issuers
        ):
            logger.info(
                f"[CARD SKIPPED] {card_name} excluded due to issuer preference."
            )
            continue

        reward_structure = card.get("reward_structure", {})
        category_rates = reward_structure.get(
            "reward_rate_per_category",
            {}
        )

        caps = card.get("caps_per_month", {})
        base_rate = float(card.get("reward_rate_base", 1.0))

        logger.info(
            f"[CARD CONFIG] base_rate={base_rate} "
            f"category_rates={len(category_rates)}"
        )

        category_rewards = []
        total_projected_annual_spend = 0.0

        for sp in spending_profile:

            card_cat = sp["card_category"]

            logger.info(
                f"[CATEGORY START] "
                f"category={card_cat} "
                f"monthly_spend={sp['monthly_spend']}"
            )

            reward_data = category_rates.get(card_cat)

            logger.info(
                f"[RATE LOOKUP] "
                f"reward_data={reward_data}"
            )

            if isinstance(reward_data, dict):
                rate = float(
                    reward_data.get(
                        "net_rate_percent",
                        base_rate
                    )
                )
            else:
                rate = base_rate

            logger.info(
                f"[RATE FOUND] "
                f"category={card_cat} "
                f"rate={rate}%"
            )

            raw_monthly_reward = (
                sp["monthly_spend"] * rate / 100
            )

            logger.info(
                f"[REWARD BEFORE CAPS] "
                f"{raw_monthly_reward}"
            )

            if caps.get("applicable", False):
                category_cap = caps.get(card_cat)

                if category_cap is not None:
                    logger.info(
                        f"[CAP APPLIED] "
                        f"category={card_cat} "
                        f"cap={category_cap}"
                    )

                    raw_monthly_reward = min(
                        raw_monthly_reward,
                        category_cap
                    )

            monthly_reward = round(
                raw_monthly_reward,
                2
            )

            annual_spend = sp["monthly_spend"] * 12

            total_projected_annual_spend += annual_spend

            logger.info(
                f"[CATEGORY RESULT] "
                f"monthly_reward={monthly_reward} "
                f"annual_spend={annual_spend}"
            )

            category_rewards.append(
                {
                    "category": sp["category"],
                    "card_category": card_cat,
                    "monthly_spend": sp["monthly_spend"],
                    "rate": rate,
                    "monthly_reward": monthly_reward,
                }
            )

        total_monthly_reward = round(
            sum(
                item["monthly_reward"]
                for item in category_rewards
            ),
            2,
        )

        annual_reward_base = total_monthly_reward * 12

        logger.info(
            f"[ANNUAL REWARD] "
            f"monthly={total_monthly_reward} "
            f"annual={annual_reward_base}"
        )

        milestone_bonus = 0.0

        for milestone in card.get(
            "milestone_rewards",
            []
        ):

            threshold = milestone.get(
                "spend_threshold_inr",
                0
            )

            logger.info(
                f"[MILESTONE CHECK] "
                f"threshold={threshold} "
                f"user_spend={total_projected_annual_spend}"
            )

            if total_projected_annual_spend >= threshold:

                logger.info(
                    f"[MILESTONE ACHIEVED] "
                    f"{milestone.get('reward')}"
                )

                milestone_bonus = max(
                    milestone_bonus,
                    1
                )

        annual_fee = float(
            card.get("annual_fee", 0)
        )

        net_annual = (
            annual_reward_base
            + milestone_bonus
            - annual_fee
        )

        logger.info(
            f"[VALUE CALC] "
            f"annual_reward={annual_reward_base} "
            f"milestone_bonus={milestone_bonus} "
            f"annual_fee={annual_fee} "
            f"net_annual={net_annual}"
        )

        intent_boost_applied = 0.0

        for favored_cat in prefs.boost_categories:

            cat_rate_data = category_rates.get(
                favored_cat,
                {}
            )

            if isinstance(cat_rate_data, dict):
                cat_rate = float(
                    cat_rate_data.get(
                        "net_rate_percent",
                        base_rate
                    )
                )
            else:
                cat_rate = base_rate

            logger.info(
                f"[PREFERENCE CHECK] "
                f"favored_cat={favored_cat} "
                f"rate={cat_rate}"
            )

            if cat_rate >= base_rate * 1.5:
                intent_boost_applied += 2000

                logger.info(
                    f"[PREFERENCE BOOST] "
                    f"+2000 for {favored_cat}"
                )

        lounge_data = card.get(
            "lounge_access",
            {}
        )

        for perk in prefs.target_perks:

            perk_lower = perk.lower()

            if "lounge" in perk_lower:

                if (
                    lounge_data.get("domestic", "0") != "0"
                    or lounge_data.get("international", "0") != "0"
                ):
                    intent_boost_applied += 2500

                    logger.info(
                        "[PERK BOOST] Lounge +2500"
                    )
                else:
                    intent_boost_applied -= 4000

                    logger.info(
                        "[PERK PENALTY] Lounge -4000"
                    )

            elif (
                "forex" in perk_lower
                or "international" in perk_lower
            ):

                forex_markup = float(
                    card.get(
                        "forex_markup",
                        3.5
                    )
                )

                if forex_markup <= 2:
                    intent_boost_applied += 2000

                    logger.info(
                        "[PERK BOOST] Forex +2000"
                    )
                else:
                    intent_boost_applied -= 3000

                    logger.info(
                        "[PERK PENALTY] Forex -3000"
                    )

        final_ranking_score = round(
            net_annual + intent_boost_applied,
            2,
        )

        perks = []

        if lounge_data.get("domestic", "0") != "0":
            perks.append(
                f"{lounge_data['domestic']} domestic lounge visits"
            )

        if lounge_data.get("international", "0") != "0":
            perks.append(
                f"{lounge_data['international']} international lounge visits"
            )

        logger.info(
            f"[CARD FINISHED] "
            f"name={card_name} "
            f"monthly_reward={total_monthly_reward} "
            f"net_annual={net_annual} "
            f"boost={intent_boost_applied} "
            f"score={final_ranking_score}"
        )

        scored.append(
            {
                "card_id": card_id,
                "name": card_name,
                "issuer": issuer,
                "tier": card.get(
                    "tier",
                    "Standard"
                ),
                "image_url": card.get(
                    "image_url",
                    ""
                ),
                "annual_fee": annual_fee,
                "card_network": card.get(
                    "network",
                    "Visa"
                ),
                "estimated_monthly_reward": total_monthly_reward,
                "net_annual_value": round(
                    net_annual,
                    2
                ),
                "final_ranking_score": final_ranking_score,
                "milestone_bonus_earned": milestone_bonus,
                "intent_boost_applied": intent_boost_applied,
                "category_rewards": sorted(
                    category_rewards,
                    key=lambda x: x["monthly_reward"],
                    reverse=True,
                ),
                "key_perks": perks
                + card.get(
                    "key_benefits",
                    []
                ),
                "reward_type": card.get(
                    "reward_currency",
                    "reward_points"
                ),
                "description": card.get(
                    "description",
                    ""
                ),
                "welcome_benefits": card.get(
                    "welcome_benefits",
                    {}
                ),
            }
        )

    scored.sort(
        key=lambda x: x["final_ranking_score"],
        reverse=True,
    )

    logger.info(
        f"\n[SCORING COMPLETE] "
        f"{len(scored)} cards ranked."
    )

    return scored

def _build_missed_rewards_input(top_card: dict, spending_profile: list[dict]) -> list[dict]:
    """Isolates top transactions to enrich via the LLM pipeline context window."""
    logger.info(f"[_MISSED REWARDS] Packing reward mapping arrays for primary recommendation: {top_card['name']}")
    all_txns = []
    rates = {cr["category"]: cr["rate"] for cr in top_card["category_rewards"]}

    for sp in spending_profile:
        rate = rates.get(sp["category"], 1.0)
        for txn in sp["top_transactions"]:
            reward_amount = round(txn["amount"] * rate / 100, 2)
            all_txns.append({
                "merchant": txn["merchant"],
                "amount": txn["amount"],
                "date": txn["date"],
                "category": sp["category"],
                "reward_earned": reward_amount,
            })

    all_txns.sort(key=lambda x: x["reward_earned"], reverse=True)
    return all_txns[:8]


async def run_reward_optimiser(
        transactions,
        api_key: str,
        preferences_text: str = "",
        model_id: str = "gemini-2.5-flash",
        statement_months: int = 1
) -> list[dict]:
    """Main entry runtime for the Reward Optimizer Engine."""
    logger.info("\n==================================================")
    logger.info(f"[ENGINE INITIALIZATION] Starting run_reward_optimiser pipeline using model context: {model_id}")

    llm = ChatGoogleGenerativeAI(model=model_id, google_api_key=api_key, temperature=0.0)

    extracted_prefs = ExtractedPreferences(boost_categories=[], target_perks=[], excluded_issuers=[])
    if preferences_text.strip():
        logger.info(f"[PREFERENCES PIPELINE] Query text string registered: '{preferences_text}'")
        try:
            structured_extractor = llm.with_structured_output(ExtractedPreferences)
            extracted_prefs = structured_extractor.invoke(
                f"Extract baseline reward metrics and filters from this user preference text string:\n\n'{preferences_text}'"
            )
            logger.info(
                f"[PREFERENCES SUCCESS] Structured Pydantic object parsed: BoostCats={extracted_prefs.boost_categories} | Perks={extracted_prefs.target_perks} | Exclude={extracted_prefs.excluded_issuers}")
        except Exception as e:
            logger.warning(f"[PREFERENCES LAYER FALLBACK] Structured preferences extraction failed: {e}")

    spending_profile = build_spending_profile(transactions, statement_months)
    if not spending_profile:
        logger.warning("[ENGINE ABORT] No rewardable transactions parsed; returning fallback empty set.")
        return []

    cards_db = _load_cards_db()
    if not cards_db:
        logger.error("[ENGINE CRITICAL] Core Cards Database is empty or unreadable.")
        return [{"type": "reward_optimisation", "error": "Database access error"}]

    # Securely calls upgraded logic sequence
    ranked_cards = score_all_cards(spending_profile, cards_db, extracted_prefs)
    if not ranked_cards:
        logger.warning("[ENGINE ABORT] All cards filtered out by rule configurations.")
        return []

    top_card = ranked_cards[0]
    runner_ups = ranked_cards[1:5]
    missed_txns = _build_missed_rewards_input(top_card, spending_profile)

    logger.info(
        f"[LLM PIPELINE] Formulating systemic prompt instructions. Primary candidate target: {top_card['name']}")

    system_prompt = """You are India's premier luxury credit card strategist. Your goal is to make card rewards feel incredibly high-value, exclusive, and tangible.

For each transaction, populate a 'what_you_missed' statement. Translate the numerical reward value into high-fidelity real-world experiences or items. Do NOT use generic phrases like 'cashback in your account' or simple coffees. Match the items to the card's specific tier.

Also populate:
1. 'why_for_you': A personalized pitch naming their top spending categories and explicitly addressing the custom preferences line they provided. Make it clear the card is tailored to both their actual spending data and explicit choices.
2. 'summary': A sharp one-liner summarizing the annual value left on the table.

Return ONLY a valid JSON object matching this schema:
{
  "missed_rewards": [
    {
      "merchant": str,
      "amount": float,
      "date": str,
      "category": str,
      "reward_earned": float,
      "what_you_missed": str
    }
  ],
  "why_for_you": str,
  "summary": str
}
No markdown block formatting wrappers. Valid raw JSON text output only."""

    human_prompt = (
        f"Recommended Strategic Card: {top_card['name']} by {top_card['issuer']}\n"
        f"Net Annual Value Generated: ₹{top_card['net_annual_value']:,}\n"
        f"User Custom Preference Text Line: '{preferences_text}'\n"
        f"Target Conversion Transactions Elements:\n{json.dumps(missed_txns, indent=2)}"
    )

    try:
        logger.info("[LLM CALL] Dispatched tracking profile data downstream to Gemini chat completions endpoint...")
        response = await asyncio.to_thread(
            llm.invoke,
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]
        )

        text = response.content.strip().replace("```json", "").replace("```", "").strip()
        logger.info(f"[LLM RESPONSE] Raw stream snippet caught: {text[:200]}")

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            text = match.group(0)

        llm_result = json.loads(text)
        logger.info("[LLM RESPONSE SUCCESS] Narrative metrics mapped securely into structural JSON object variables.")
    except Exception as e:
        logger.warning(
            f"[LLM NARRATIVE CRASH] Narrative enrichment tracking failed: {e}. Executing default schema fallback mapping layer.")
        llm_result = {
            "missed_rewards": [{**t, "what_you_missed": f"₹{t['reward_earned']} locked in card point balances."} for t
                               in missed_txns],
            "why_for_you": f"Selected to complement your card profile rules and velocity trends.",
            "summary": f"Maximize portfolio efficiency to claim an extra ₹{top_card['net_annual_value']:,}/year."
        }

    outbound_response = [{
        "type": "reward_optimisation",
        "user_preferences_processed": extracted_prefs.dict(),
        "top_pick": {
            **top_card,
            "why_for_you": llm_result.get("why_for_you", ""),
        },
        "missed_rewards": llm_result.get("missed_rewards", []),
        "spending_profile": spending_profile,
        "runner_ups": runner_ups,
        "summary": llm_result.get("summary", ""),
    }]

    logger.info("[ENGINE EXECUTION FINISHED] Returning finalized array packet cleanly.")
    logger.info("==================================================")
    return outbound_response
