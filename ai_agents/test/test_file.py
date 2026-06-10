import os

# Define mock transaction string content mimicking a standard Indian banking log.
# This contains intentional duplicate charges, liability EMIs, and a massive outlier spike.
MOCK_STATEMENT_CONTENT = """
========================================================================
                      FINSPRINT BANK OF INDIA SECURE LOG
========================================================================
CIF NO: 90234123512
ACCOUNT NUMBER: 40921011002341
STATEMENT PERIOD: 01/06/2026 TO 08/06/2026
------------------------------------------------------------------------
DATE        TRANSACTION DESCRIPTION                 DEBIT/CREDIT  AMOUNT
------------------------------------------------------------------------
01/06/2026  IMPS-HDFC-LOAN-EMI-912384               DEBIT         15000.00
02/06/2026  ZOMATO-FOOD-DELIVERY-GURGAON            DEBIT           650.00
03/06/2026  SWIGGY-INSTAMART-GROCERIES              DEBIT          1200.00
04/06/2026  SWIGGY-INSTAMART-GROCERIES              DEBIT          1201.50
05/06/2026  AMAZON-INDIA-RETAIL-GADGETS             DEBIT         75000.00
06/06/2026  NETFLIX-STREAMING-MUMBAI                DEBIT           649.00
06/06/2026  NETFLIX-STREAMING-MUMBAI                DEBIT           649.00
07/06/2026  ADANI-ELECTRICITY-BILLS                 DEBIT          3200.00
08/06/2026  JIO-DIGITAL-RECHARGE                    DEBIT           499.00
------------------------------------------------------------------------
========================================================================
"""


def generate_sample_file(filename="sample_bank_statement.txt"):
    try:
        # Write clean mock transaction parameters to a text file artifact
        with open(filename, "w", encoding="utf-8") as f:
            f.write(MOCK_STATEMENT_CONTENT.strip())

        print(f"✅ Success: Generated realistic testing file footprint at: '{os.path.abspath(filename)}'")
        print("💡 Anomalies baked into this file for your insights module to find:")
        print("  1. Liability Entry: HDFC-LOAN-EMI (₹15,000.00)")
        print("  2. Large Outlier Spike: AMAZON-INDIA (₹75,000.00) -> Exceeds 5x average baseline")
        print("  3. Double Payment: Two identical NETFLIX charges (₹649.00) on 06/06/2026 within 48 hours")

    except Exception as e:
        print(f"❌ Failed to generate test statement file: {e}")


if __name__ == "__main__":
    generate_sample_file()