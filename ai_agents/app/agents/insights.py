import logging
import json
from collections import defaultdict
from datetime import timedelta, datetime
from typing import List, Dict
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)

INSIGHT_CATEGORIES = {"streaming", "entertainment", "health", "subscription", "software", "food", "shopping"}

LIABILITY_CATEGORIES = {"loan", "emi", "rent", "insurance", "utilities", "bills", "banking", "tax"}

INSIGHTS_ENRICHMENT_PROMPT = """
You are a 'FinSprint Insights Agent' reviewing financial transaction findings.
Your goal is to identify and explain unusual or significant financial activity within the give transactions.

For each finding, add exactly two fields:

- explanation: Maximum 2 Sentence .Just Use the merchant name and rupee amounts.
  Explain what was detected (e.g., a subscription, a loan EMI, a large one-off spike, or a double charge) and why the user should notice it.
  If it's a 'recurring_spike', mention that the regular payment amount has increased.
  If it's an 'unusual_large', explain it's a significant outlier compared to their typical spend.
  If it's a 'liability', recognize it as a fixed cost like an EMI or Bill.

- action: 1 sentence. Tell the user exactly what to do next.
  For double_payment: raising a dispute.
  For expensive/spike: reviewing the bill or usage.
  For unknown_large: verifying the recipient.
  For duplicate: suggesting cancellation.

Return the same JSON list with only these two fields added.
No markdown. No commentary. Valid JSON only.
"""

def detect_recurring_and_spikes(transactions: list) -> List[dict]:
    """Identifies recurring payments and flags any significant amount increases."""
    # Expects objects conforming to your Transaction data schema (e.g., t.amount, t.merchant_name, t.date, t.category)
    debits = [t for t in transactions if t.amount > 0]
    merchants = defaultdict(list)
    for t in debits:
        merchants[t.merchant_name.lower()].append(t)
        
    findings = []
    for merchant_lower, txns in merchants.items():
        if len(txns) < 2:
            continue
            
        txns.sort(key=lambda x: x.date)
        intervals = [(txns[i].date - txns[i-1].date).days for i in range(1, len(txns))]
        monthly_intervals = [d for d in intervals if 20 <= d <= 40]
        
        if intervals and (len(monthly_intervals) / len(intervals)) >= 0.5:
            first_amount = txns[0].amount
            last_amount = txns[-1].amount
            
            finding_type = "recurring"
            if last_amount > first_amount * 1.2:  # 20% increase rule boundary
                finding_type = "recurring_spike"
                
            findings.append({
                "merchant": txns[0].merchant_name,
                "monthly_amount": last_amount,
                "previous_amount": first_amount,
                "annual_cost": last_amount * 12,
                "charge_count": len(txns),
                "subtype": finding_type,
                "category": txns[0].category
            })
            
    return findings

def detect_large_outliers(transactions: list) -> List[dict]:
    """Identifies one-off payments that are significantly larger than the average txn."""
    debits = [t for t in transactions if t.amount > 0]
    if not debits: 
        return []
    
    avg_txn = sum(t.amount for t in debits) / len(debits)
    findings = []
    
    # Flag anything > 5x average and > 5000 absolute threshold
    for t in debits:
        if t.amount > max(avg_txn * 5, 5000):
            findings.append({
                "merchant": t.merchant_name,
                "amount": t.amount,
                "subtype": "unusual_large",
                "transaction_date": t.date.strftime("%d/%m/%Y"),
                "category": t.category
            })
    return findings

def detect_double_payments(transactions: list) -> List[dict]:
    """Scans for potential duplicate transactions within a 48-hour window."""
    debits = [t for t in transactions if t.amount > 0]
    debits.sort(key=lambda x: x.date)
    findings = []
    flagged_pairs = set()
    
    for i in range(len(debits)):
        if i in flagged_pairs: 
            continue
        t1 = debits[i]
        for j in range(i + 1, len(debits)):
            t2 = debits[j]
            if t2.date - t1.date > timedelta(hours=48): 
                break
            if j in flagged_pairs: 
                continue
            if t1.merchant_name.lower() == t2.merchant_name.lower() and abs(t1.amount - t2.amount) <= 5:
                findings.append({
                    "type": "insight",
                    "subtype": "double_payment",
                    "merchant": t1.merchant_name,
                    "amount": t2.amount,
                    "severity": "high",
                    "first_charge_date": t1.date.strftime("%d/%m/%Y"),
                    "second_charge_date": t2.date.strftime("%d/%m/%Y"),
                })
                flagged_pairs.add(i)
                flagged_pairs.add(j)
                break
    return findings

def run_insights_agent(transactions: list, api_key: str, model_id: str = "gemini-2.5-flash") -> List[dict]:
    """
    Main execution pipeline for the Insights Engine.
    Runs deterministic analytics before generating natural language fields.
    """
    recurring = detect_recurring_and_spikes(transactions)
    outliers = detect_large_outliers(transactions)
    doubles = detect_double_payments(transactions)
    
    raw = []
    seen_merchants = set()

    for f in doubles:
        raw.append({**f, "type": "insight", "severity": "high", "rupee_impact": f["amount"]})
        seen_merchants.add(f["merchant"].lower())

    for f in recurring:
        cat_lower = str(f["category"]).lower()
        is_liability = cat_lower in LIABILITY_CATEGORIES or any(k in f["merchant"].lower() for k in ["loan", "emi", "hdfc", "icici", "pspcl"])
        
        subtype = f["subtype"]
        if is_liability:
            subtype = "liability"
            
        raw.append({
            **f,
            "type": "insight",
            "subtype": subtype,
            "severity": "medium" if f["subtype"] == "recurring_spike" else "low",
            "rupee_impact": f["monthly_amount"]
        })
        seen_merchants.add(f["merchant"].lower())

    for f in outliers:
        if f["merchant"].lower() not in seen_merchants:
            raw.append({**f, "type": "insight", "severity": "medium", "rupee_impact": f["amount"]})

    if not raw:
        return []

    llm = ChatGoogleGenerativeAI(model=model_id, api_key=api_key, temperature=0.0)
    
    full_prompt = f"{INSIGHTS_ENRICHMENT_PROMPT}\n\nData Payload:\n{json.dumps(raw)}"
    
    try:
        response = llm.invoke(full_prompt)
        clean_content = response.content.replace("```json", "").replace("```", "").strip()
        enriched_findings = json.loads(clean_content)
        return enriched_findings
    except Exception as e:
        logger.error(f"LLM Enrichment block execution error: {e}")
        for item in raw:
            item["explanation"] = "Detected variant financial pattern. Review transaction records."
            item["action"] = "Verify transaction activity history manually."
        return raw