"""
Offline script: Parse a scheme guideline PDF using Gemini API to extract
structured rule records. Demonstrates scaling pipeline to 3,000 schemes.

Usage:
    python scripts/parse_scheme_pdf.py --pdf path/to/scheme.pdf --api-key KEY

Output: JSON rule record matching the scheme schema.
"""

import argparse
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "name_hi": {"type": "string"},
        "name_en": {"type": "string"},
        "benefit_amount": {"type": "string"},
        "benefit_period": {"type": "string"},
        "eligibility": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "field": {"type": "string"},
                    "operator": {"type": "string", "enum": ["eq", "gte", "lte", "in", "nin"]},
                    "value": {}
                }
            }
        },
        "renewal_period_days": {"type": "integer"},
        "lapse_triggers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["ekyc_missed", "payment_gap", "renewal_missed", "bank_account_changed"]},
                    "desc_hi": {"type": "string"},
                    "desc_en": {"type": "string"}
                }
            }
        },
        "documents": {"type": "array", "items": {"type": "string"}},
        "apply_url": {"type": "string"},
        "form_fields": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "label_hi": {"type": "string"},
                    "label_en": {"type": "string"},
                    "type": {"type": "string"}
                }
            }
        }
    },
    "required": ["id", "name_hi", "name_en", "benefit_amount", "eligibility", "renewal_period_days", "lapse_triggers", "documents", "form_fields"]
}


def extract_pdf_text(pdf_path):
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except ImportError:
        print("PyPDF2 not installed. Install with: pip install PyPDF2")
        sys.exit(1)


def parse_with_gemini(text, api_key):
    try:
        import google.generativeai as genai
    except ImportError:
        print("google-generativeai not installed. Install with: pip install google-generativeai")
        sys.exit(1)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""You are a government scheme parser for India. Extract structured data from the following scheme guideline document.

Return a JSON object matching this exact schema:
{json.dumps(SCHEMA, indent=2, ensure_ascii=False)}

Guidelines document:
{text[:15000]}

Rules:
1. id should be a short kebab-case identifier like "pm-kisan"
2. name_hi is the Hindi name, name_en the English name
3. benefit_amount includes ₹ symbol and period like "₹6,000/वर्ष"
4. eligibility rules use operators: eq, gte, lte, in, nin and field names: age, gender, state, occupation, land_owner, annual_income, has_daughter, bank_account_changed
5. lapse_triggers describe what causes a beneficiary to lose the scheme
6. documents is a list of required documents in Hindi with English in parentheses
7. form_fields are the fields needed in the application form

Return ONLY valid JSON, no other text."""

    response = model.generate_content(prompt)
    text_response = response.text.strip()

    if text_response.startswith("```"):
        text_response = text_response.split("\n", 1)[1]
        text_response = text_response.rsplit("```", 1)[0]

    return json.loads(text_response)


def main():
    parser = argparse.ArgumentParser(description="Parse scheme PDF into rule record")
    parser.add_argument("--pdf", required=True, help="Path to scheme guideline PDF")
    parser.add_argument("--api-key", help="Gemini API key (or set GEMINI_API_KEY env var)")
    parser.add_argument("--output", "-o", help="Output JSON file path")
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: Gemini API key required. Use --api-key or set GEMINI_API_KEY env var.")
        sys.exit(1)

    print(f"Extracting text from: {args.pdf}")
    text = extract_pdf_text(args.pdf)
    print(f"Extracted {len(text)} characters")

    print("Sending to Gemini for parsing...")
    result = parse_with_gemini(text, api_key)
    print("Parsed successfully!")

    output = json.dumps(result, indent=2, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"Written to: {args.output}")
    else:
        print(output)

    # Validate against schema
    print("\n--- SUMMARY ---")
    print(f"Scheme ID: {result.get('id')}")
    print(f"Name (HI): {result.get('name_hi')}")
    print(f"Name (EN): {result.get('name_en')}")
    print(f"Benefit: {result.get('benefit_amount')}")
    print(f"Eligibility rules: {len(result.get('eligibility', []))}")
    print(f"Lapse triggers: {len(result.get('lapse_triggers', []))}")
    print(f"Documents: {len(result.get('documents', []))}")
    print(f"Form fields: {len(result.get('form_fields', []))}")


if __name__ == "__main__":
    main()
