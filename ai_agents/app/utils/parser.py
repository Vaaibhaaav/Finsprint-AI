# import io
# import json
# import csv
# import logging
# import datetime
# import re
#
# import pdfplumber
# from typing import List,Dict
#
# logger = logging.getLogger(__name__)
#
# def parse_bank_statement_bytes(file_bytes : bytes) -> List[Dict]:
#     """
#         In-memory Statement Parser Pipeline.
#         Detects the file type via byte signatures and extracts a uniform transaction array.
#         """
#     if not file_bytes:
#         return []
#
#     if file_bytes.startswith(b'%PDF'):
#         logger.info("Parser engine : Detected incoming PDF binary stream")
#         return _parse_pdf_statements(file_bytes)
#     else:
#         logger.info("Parser engine : Treated incoming stream as a CSV/Text dataset")
#         return _parse_csv_statements(file_bytes)
#
# def _parse_pdf_statements(file_bytes : bytes) -> List[Dict]:
#     """Extracts structural text tables from standard Indian bank statement PDFs."""
#     parsed_transactions = []
#
#     with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
#         for page_num , page in enumerate(pdf.pages):
#             tables = page.extract_tables()
#             for table in tables:
#                 for row in table:
#                     row_clean = [cell.strip() for cell in row if cell is not None and cell.strip() != ""]
#
#                     if len(row_clean) >= 3:
#                         extracted = _attempt_row_extraction(row_clean)
#                         if extracted:
#                             parsed_transactions.append(extracted)
#
#     logger.info(f"PDF Parsing finished , Extracted {len(parsed_transactions)} rows")
#     return parsed_transactions
#
# def _parse_csv_statements(file_bytes : bytes) -> List[Dict]:
#     """Extracts transactional values out of flat standard csv statements."""
#     parsed_transactions = []
#     try:
#         text_stream = io.StringIO(file_bytes.decode('utf-8',errors='ignore'))
#         reader = csv.reader(text_stream)
#
#         for row in reader:
#             row_clean = [cell.strip() for cell in row if cell.strip() != ""]
#             if len(row_clean) >= 3:
#                 extracted = _attempt_row_extraction(row_clean)
#                 if extracted:
#                     parsed_transactions.append(extracted)
#     except Exception as e:
#         logger.error(f"CSV line extraction crashed with error : {e}")
#
#     return parsed_transactions
#
# def _attempt_row_extraction(row_cells : List[str]) -> Dict | None:
#     """
#         Regex heuristic processor trying to normalize varying bank columns
#         into: merchant_clean, debit, category, and date objects.
#         """
#     date_pattern = r'(\d{2}[-/.\s]\d{2}[-/.\s]\d{4}|\d{2}[-/.\s][A-Za-z]{3}[-/.\s]\d{4})'
#
#     date_match = None
#     for cell in row_cells[:2]:
#         found = re.search(date_pattern,cell)
#         if found:
#             date_match = found.group(1)
#             break
#
#     if not date_match:
#         return None
#
#     debit_val = 0.0
#     numeric_found = False
#
#     for cell in reversed(row_cells):
#         clean_num = cell.replace(",","").replace("₹","").strip()
#
#         if re.match(r'^\d+(\.\d{1,2})?$', clean_num):
#             val = float(clean_num)
#             if val > 0:
#                 debit_val = val
#                 numeric_found = True
#                 break
#
#     if not numeric_found or debit_val == 0.0:
#         return None
#
#     description = "Unknown Merchant"
#     for cell in row_cells:
#         if cell != date_match and not any(char.isdigit() for char in cell if char != '-'):
#             if len(cell) > 4:
#                 description = cell
#                 break
#
#
#     return{"id": f"parsed_{int(datetime.datetime.now().timestamp())}_{row_cells[0][:3]}",
#      "merchant_clean": description[:40].strip(),
#      "debit": debit_val,
#      "category": "other",
#      "date": date_match
#      }

import io
import re
import csv
import logging
import datetime
from typing import List, Dict

logger = logging.getLogger(__name__)


def parse_bank_statement_bytes(file_bytes: bytes) -> List[Dict]:
    """
    In-memory Statement Parser Pipeline.
    Detects the file type via byte signatures and extracts a uniform transaction array.
    """
    if not file_bytes:
        return []

    if file_bytes.startswith(b'%PDF'):
        logger.info("Parser Engine: Detected incoming PDF binary stream.")
        return _parse_pdf_statement(file_bytes)
    else:
        logger.info("Parser Engine: Treating incoming stream as Text/CSV dataset.")
        return _parse_csv_statement(file_bytes)


def _parse_pdf_statement(file_bytes: bytes) -> List[Dict]:
    """Extracts structural text tables from standard bank statement PDFs."""
    parsed_transactions = []
    import pdfplumber
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                if not tables:
                    # Fallback to raw text parsing per page if tables aren't structurally bound
                    text = page.extract_text()
                    if text:
                        parsed_transactions.extend(_parse_raw_text_lines(text.split("\n")))
                    continue

                for table in tables:
                    for row in table:
                        row_clean = [cell.strip() for cell in row if cell is not None and cell.strip() != ""]
                        if len(row_clean) >= 3:
                            extracted = _attempt_row_extraction(row_clean)
                            if extracted:
                                parsed_transactions.append(extracted)
    except Exception as e:
        logger.error(f"PDF Extraction failure: {e}")
    return parsed_transactions


def _parse_csv_statement(file_bytes: bytes) -> List[Dict]:
    """Extracts transactional values out of flat CSV or whitespace-aligned text records."""
    try:
        raw_text = file_bytes.decode('utf-8', errors='ignore')
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        return _parse_raw_text_lines(lines)
    except Exception as e:
        logger.error(f"Text statement parsing failed: {e}")
        return []


def _parse_raw_text_lines(lines: List[str]) -> List[Dict]:
    parsed_transactions = []

    date_pattern = r'(\d{2}[-/.]\d{2}[-/.]\d{4})'
    amount_pattern = r'(\d[\d,]*\.\d{2})'  # removed \s*$ anchor — amount is mid-line

    skip_keywords = ["BALANCE", "CIF NO", "ACCOUNT NUMBER", "PERIOD", "STATEMENT",
                     "DEBIT/CREDIT", "TRANSACTION", "========", "--------"]

    for line in lines:
        # Skip header/footer/separator lines
        if any(keyword in line.upper() for keyword in skip_keywords):
            continue

        date_match = re.search(date_pattern, line)
        amount_matches = re.findall(amount_pattern, line)  # findall not search

        if not date_match or not amount_matches:
            continue

        # Take the LAST amount found — avoids picking up date-like numbers
        amount_str = amount_matches[-1].replace(",", "")
        amount_val = float(amount_str)

        if amount_val == 0:
            continue

        # Strip date and amount from line to extract description
        description = line
        description = description.replace(date_match.group(0), "")
        for amt in amount_matches:
            description = description.replace(amt, "")
        description = re.sub(r'\s+(DEBIT|CREDIT)\s+', ' ', description, flags=re.IGNORECASE)
        description = re.sub(r'[-/|]+', ' ', description)  # remove separators
        description = re.sub(r'\s+', ' ', description).strip()

        parsed_transactions.append({
            "id": f"parsed_{int(datetime.datetime.now().timestamp())}_{amount_str.replace('.', '')}",
            "merchant_clean": description if description else "Unknown Merchant",
            "debit": amount_val,
            "category": "other",
            "date": date_match.group(1)
        })

    return parsed_transactions

def _attempt_row_extraction(row_cells: List[str]) -> Dict | None:
    """Fallback row heuristic parser for clean multidimensional table arrays."""
    date_pattern = r'(\d{2}[-/.]\d{2}[-/.]\d{4})'

    date_match = None
    for cell in row_cells[:2]:
        found = re.search(date_pattern, cell)
        if found:
            date_match = found.group(1)
            break

    if not date_match:
        return None

    debit_val = 0.0
    numeric_found = False
    for cell in reversed(row_cells):
        clean_num = cell.replace(",", "").replace("₹", "").strip()
        try:
            val = float(clean_num)
            if val > 0:
                debit_val = val
                numeric_found = True
                break
        except ValueError:
            continue

    if not numeric_found:
        return None

    description = "Unknown Merchant"
    for cell in row_cells:
        if cell != date_match and not any(char.isdigit() for char in cell if char != '-'):
            if len(cell) > 3:
                description = cell
                break

    return {
        "id": f"parsed_{int(datetime.datetime.now().timestamp())}",
        "merchant_clean": description.strip(),
        "debit": debit_val,
        "category": "other",
        "date": date_match
    }