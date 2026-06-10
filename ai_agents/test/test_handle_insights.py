import os
import base64
import json
import requests
from datetime import date

# Configuration parameters matching your private network setup
FASTAPI_URL = "http://localhost:8000/api/v1/agent/insights"
SAMPLE_FILE_PATH = "sample_bank_statement.txt"


def run_integration_test():
    print("🚀 Initializing FinSprint AI Service End-to-End Test...")

    # 1. Verify existence of the mock bank statement artifact
    if not os.path.exists(SAMPLE_FILE_PATH):
        print(f"❌ Error: Test statement file not found at '{SAMPLE_FILE_PATH}'")
        return

    # 2. Simulate Go's io.ReadAll() by loading the file into memory bytes
    with open(SAMPLE_FILE_PATH, "rb") as f:
        raw_file_bytes = f.read()

    # 3. Simulate Go's json.Marshal() by encoding the binary slice into a Base64 string
    base64_encoded_string = base64.b64decode = base64.b64encode(raw_file_bytes).decode('utf-8')

    # 4. Assemble the exact UnifiedInboundPayload JSON structure
    # This precisely matches your updated schema with capitalized user profile database fields
    payload = {
        "message": "Scan my June statement logs for potential double payments.",
        "Transactions": base64_encoded_string,
        "user_profile": {
            "user": {
                "id": "usr_vaibhav_aggarwal_94",
                "name": "Vaibhav Aggarwal",
                "email": "vaibhav@nitkkr.ac.in"
            },
            "transactions": [
                {
                    "ID": "tx_01",
                    "Amount": 1200.00,
                    "TransactionType": "debit",
                    "Merchant": "Netflix India",
                    "Category": "streaming",
                    "Description": "Monthly premium plan auto-debit",
                    "Motive": "entertainment"
                },
                {
                    "ID": "tx_02",
                    "Amount": 4500.00,
                    "TransactionType": "debit",
                    "Merchant": "Amazon Prime",
                    "Category": "shopping",
                    "Description": "Electronic accessories purchase",
                    "Motive": "gadget_purchase"
                }
            ],
            "goals": [
                {
                    "ID": "goal_01",
                    "Description": "Build Portfolio Project Piece Milestone",
                    "TargetAmount": 15000.00,
                    "Deadline": str(date(2026, 9, 15)),
                    "WeeklyTarget": 1250.00,
                    "SavedAmount": 3000.00
                }
            ]
        }
    }

    print("📤 Forwarding structured transaction network payload envelope to FastAPI...")

    try:
        # Send the POST request across the network HTTP gateway channel
        response = requests.post(
            FASTAPI_URL,
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        print(f"📥 Received Response Status Code: {response.status_code}")

        # 5. Parse and print the uniform Go Response Envelope returned by Python
        response_json = response.json()
        print("\n🎯 --- Unified Response Envelope Output ---")
        print(json.dumps(response_json, indent=2))
        print("-------------------------------------------\n")

        if response_json.get("status") == "success":
            print("✅ Success: The parsing layer and graph nodes compiled flawlessly!")
        else:
            print("⚠️ Notice: Request completed but returned a non-success flag status.")

    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Failure: Is your FastAPI server actively running on {FASTAPI_URL.split('/api')[0]}?")
    except Exception as e:
        print(f"❌ Test script runtime exception encountered: {str(e)}")


if __name__ == "__main__":
    run_integration_test()