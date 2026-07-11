import requests
import json
import re
import sys
import time
from datetime import datetime

API_KEY = 'tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc'
API_BASE = 'https://api.myscheme.gov.in/schemes/v6/public/schemes'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'x-api-key': API_KEY,
}

VERIFIED_SLUGS = [
    'pm-kisan',         # Pradhan Mantri Kisan Samman Nidhi
    'pmfby',             # PM Fasal Bima Yojana
    'pmay-g',            # PM Awas Yojana - Gramin
    'amrut',             # Atal Mission for Rejuvenation and Urban Transformation
    'apy',               # Atal Pension Yojana
    'day-nrlm',          # Deendayal Antyodaya Yojana - NRLM
    'kcc',               # Kisan Credit Card
    'mgnrega',           # MGNREGA
    'naps',              # National Apprenticeship Promotion Scheme
    'nmmss',             # National Means-cum-Merit Scholarship Scheme
    'pm-poshan',         # PM POSHAN (Mid-Day Meal)
    'pm-svanidhi',       # PM SVANidhi
    'pm-yasasvitcseobcebcdnts',  # PM-YASASVI
    'pmegp',             # PM Employment Generation Programme
    'pmgsy',             # PM Gram Sadak Yojana
    'pmjjby',            # PM Jeevan Jyoti Bima Yojana
    'pmmvy',             # PM Matru Vandana Yojana
    'pmmy',              # PM Mudra Yojana
    'pmsby',             # PM Suraksha Bima Yojana
    'pmvs',              # PM Vidyalaxmi
    'shc',               # Soil Health Card
    'sui',               # Stand-Up India
    'pmjdy',             # PM Jan Dhan Yojana
    'ab-pmjay',          # Ayushman Bharat PM-JAY
    'pmsc',              # Post Matric Scholarship
    'jjm',               # Jal Jeevan Mission
    'pm-janman',         # PM Janjati Adivasi Nyaya Maha Abhiyan
    'npsvs',             # NPS Vatsalya
]


def fetch_scheme(slug, lang='en'):
    params = {'slug': slug, 'lang': lang}
    r = requests.get(API_BASE, params=params, headers=HEADERS, timeout=30)
    if r.status_code != 200:
        return None
    data = r.json()
    api_data = data.get('data')
    if not api_data or not api_data.get('_id'):
        return None
    locale_data = api_data.get(lang, {})
    locale_data['_id'] = api_data['_id']
    locale_data['slug'] = api_data.get('slug', slug)
    locale_data['eligibilityCriteria'] = api_data.get('eligibilityCriteria', {})
    return locale_data


def fetch_documents(scheme_id, lang='en'):
    url = f'{API_BASE}/{scheme_id}/documents?lang={lang}'
    r = requests.get(url, headers=HEADERS, timeout=30)
    if r.status_code == 200:
        data = r.json()
        d = data.get('data', {})
        if isinstance(d, dict):
            locale = d.get(lang, {})
            docs = locale.get('documents_required', [])
            if docs:
                return docs
    return []


def fetch_faqs(scheme_id, lang='en'):
    url = f'{API_BASE}/{scheme_id}/faqs?lang={lang}'
    r = requests.get(url, headers=HEADERS, timeout=30)
    if r.status_code == 200:
        data = r.json()
        d = data.get('data', {})
        if isinstance(d, dict):
            locale = d.get(lang, {})
            faqs = locale.get('faqs', [])
            if faqs:
                return faqs
    return []


def fetch_application_channels(scheme_id):
    url = f'{API_BASE}/{scheme_id}/applicationchannel'
    r = requests.get(url, headers=HEADERS, timeout=30)
    if r.status_code == 200:
        data = r.json()
        channels = data.get('data', [])
        if isinstance(channels, list):
            return channels
    return []


def extract_text_from_richtext(node):
    if isinstance(node, str):
        return node
    if isinstance(node, dict):
        texts = []
        if node.get('text'):
            texts.append(node['text'])
        for child in node.get('children', []):
            texts.append(extract_text_from_richtext(child))
        return ' '.join(t for t in texts if t)
    if isinstance(node, list):
        return ' '.join(extract_text_from_richtext(item) for item in node)
    return str(node) if node else ''


def extract_benefit_amount(benefits_md, content):
    patterns = [
        r'(?:Rs\.?|INR|₹)\s*([0-9,]+)\s*(?:per|p\.a\.|yearly|annually|/year|/annum|\/)',
        r'(?:Rs\.?|INR|₹)\s*([0-9,]+)\s*/-',
        r'amount of\s*(?:Rs\.?|INR|₹)\s*([0-9,]+)',
    ]
    text = benefits_md or ''
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            amt = m.group(1).replace(',', '')
            try:
                val = int(amt)
                if val >= 100000:
                    return f"₹{val:,}/year"
                elif val >= 1000:
                    return f"₹{val:,}/year"
                else:
                    return f"₹{val}/year"
            except:
                pass
    return "Varies/year"


def extract_eligibility_rules(en_data):
    rules = []
    tags = en_data.get('basicDetails', {}).get('tags', [])
    tags_lower = [t.lower() for t in tags]
    scheme_name = en_data.get('basicDetails', {}).get('schemeName', '').lower()

    if any(t in tags_lower for t in ['farmer', 'kisan', 'agriculture', 'agricultural', 'crop', 'land']):
        rules.append({"field": "occupation", "operator": "in", "value": ["farmer"]})

    if any(t in tags_lower for t in ['student', 'scholarship', 'education', 'school', 'college']):
        rules.append({"field": "occupation", "operator": "in", "value": ["student"]})

    if any(t in tags_lower for t in ['worker', 'labour', 'employment', 'shram', 'skill', 'apprenticeship']):
        rules.append({"field": "occupation", "operator": "in", "value": ["worker"]})

    if any(t in tags_lower for t in ['senior', 'pension', 'vridha', 'elderly', 'old age']):
        rules.append({"field": "age", "operator": "gte", "value": 60})

    if any(t in tags_lower for t in ['women', 'woman', 'female', 'girl', 'matru', 'maternity']):
        rules.append({"field": "gender", "operator": "eq", "value": "female"})

    if 'loan' in scheme_name or 'credit' in scheme_name.lower() or 'mudra' in scheme_name.lower():
        pass

    if any(t in tags_lower for t in ['land', 'landholding']):
        rules.append({"field": "land_owner", "operator": "eq", "value": True})

    if not rules:
        rules.append({"field": "annual_income", "operator": "lte", "value": "200000"})

    return rules


def generate_lapse_triggers(scheme_id):
    return [
        {"type": "ekyc_missed", "desc_hi": "eKYC नहीं कराया", "desc_en": "eKYC not completed"},
        {"type": "payment_gap", "desc_hi": "भुगतान नहीं मिला", "desc_en": "Payment missed", "days": 180},
        {"type": "renewal_missed", "desc_hi": "नवीनीकरण नहीं किया", "desc_en": "Renewal not done"},
    ]


def generate_form_fields(scheme_id, documents):
    return [
        {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
        {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
        {"name": "ifsc", "label_hi": "IFSC कोड", "label_en": "IFSC Code", "type": "text"},
    ]


def extract_document_text(doc_node):
    if isinstance(doc_node, str):
        return doc_node
    if isinstance(doc_node, dict):
        if doc_node.get('text'):
            return doc_node['text']
        for child in doc_node.get('children', []):
            result = extract_document_text(child)
            if result:
                return result
    if isinstance(doc_node, list):
        for item in doc_node:
            result = extract_document_text(item)
            if result:
                return result
    return ''


def transform_to_scheme_format(slug, en_data, hi_data):
    en_basic = en_data.get('basicDetails', {})
    en_content = en_data.get('schemeContent', {})
    hi_basic = hi_data.get('basicDetails', {})

    scheme_id = slug.replace('_', '-').lower()

    benefit_text = en_content.get('benefits_md', '') or ''
    benefit_amount = extract_benefit_amount(benefit_text, en_content)
    eligibility_rules = extract_eligibility_rules(en_data)

    scheme_id_val = en_data.get('_id', '')
    documents_en = fetch_documents(scheme_id_val, 'en')
    doc_list = []
    for d in documents_en:
        text = extract_document_text(d)
        if text and text not in doc_list:
            doc_list.append(text)
    if not doc_list:
        doc_list = default_documents()

    apply_url = ''
    channels = fetch_application_channels(scheme_id_val)
    if isinstance(channels, list):
        for ch in channels:
            if isinstance(ch, dict):
                url = ch.get('applicationUrl', '') or ch.get('value', '')
                if url and url != 'https://temp.com':
                    apply_url = url
                    break
    if not apply_url:
        refs = en_content.get('references', [])
        if refs and isinstance(refs, list) and len(refs) > 0:
            if isinstance(refs[0], dict):
                apply_url = refs[0].get('url', '')

    return {
        "id": scheme_id,
        "name_hi": hi_basic.get('schemeName', en_basic.get('schemeName', '')),
        "name_en": en_basic.get('schemeName', ''),
        "benefit_amount": benefit_amount,
        "benefit_period": "year",
        "eligibility": json.dumps(eligibility_rules),
        "renewal_period_days": 365,
        "lapse_triggers": json.dumps(generate_lapse_triggers(scheme_id)),
        "documents": json.dumps(doc_list),
        "apply_url": apply_url,
        "form_fields": json.dumps(generate_form_fields(scheme_id, doc_list)),
    }


def default_documents():
    return [
        "Aadhaar Card",
        "Bank Account Details",
        "Passport Size Photo",
        "Mobile Number"
    ]


def scrape_all_schemes():
    results = []
    errors = []
    total = len(VERIFIED_SLUGS)

    print(f"Scraping {total} schemes from myScheme API...\n")
    for idx, slug in enumerate(VERIFIED_SLUGS):
        try:
            en_data = fetch_scheme(slug, 'en')
            hi_data = fetch_scheme(slug, 'hi')
            if en_data:
                scheme = transform_to_scheme_format(slug, en_data, hi_data or en_data)
                results.append(scheme)
                name = en_data.get('basicDetails', {}).get('schemeName', slug)
                print(f"  [{idx+1}/{total}] OK: {name[:70]}")
            else:
                print(f"  [{idx+1}/{total}] --: {slug} (not found on API)")
                errors.append(slug)
        except Exception as e:
            print(f"  [{idx+1}/{total}] XX: {slug}: {e}")
            errors.append(slug)
        time.sleep(0.3)

    print(f"\nDone. {len(results)} schemes scraped, {len(errors)} errors.")
    return results, errors


def import_to_database(schemes):
    from database import get_connection
    conn = get_connection()
    count = 0
    for s in schemes:
        existing = conn.execute("SELECT id FROM schemes WHERE id=?", (s["id"],)).fetchone()
        if existing:
            conn.execute("""UPDATE schemes SET
                name_hi=?, name_en=?, benefit_amount=?, benefit_period=?,
                eligibility=?, renewal_period_days=?, lapse_triggers=?,
                documents=?, apply_url=?, form_fields=?
                WHERE id=?""",
                (s["name_hi"], s["name_en"], s["benefit_amount"], s["benefit_period"],
                 s["eligibility"], s["renewal_period_days"], s["lapse_triggers"],
                 s["documents"], s["apply_url"], s["form_fields"], s["id"]))
        else:
            conn.execute("""INSERT INTO schemes
                (id, name_hi, name_en, benefit_amount, benefit_period,
                 eligibility, renewal_period_days, lapse_triggers,
                 documents, apply_url, form_fields)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (s["id"], s["name_hi"], s["name_en"], s["benefit_amount"], s["benefit_period"],
                 s["eligibility"], s["renewal_period_days"], s["lapse_triggers"],
                 s["documents"], s["apply_url"], s["form_fields"]))
        count += 1
    conn.commit()
    conn.close()
    return count


if __name__ == '__main__':
    results, errors = scrape_all_schemes()
    if results:
        count = import_to_database(results)
        print(f"Imported {count} schemes into database.")
