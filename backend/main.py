from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
from pathlib import Path
import os
from datetime import datetime
from database import get_connection, init_db, seed_schemes, seed_categories, seed_demo_profile
from rules_engine import scan_profile, calculate_total_benefit, calculate_estimated_time
from scraper import scrape_all_schemes, import_to_database
from whatsapp_service import send_whatsapp, send_scheme_alert
from ai_service import chat as ai_chat, process_life_event, generate_action_plan, is_available as ai_available

FORMS_DIR = Path(__file__).parent / "forms"

app = FastAPI(title="Scheme Sarthi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProfileCreate(BaseModel):
    name: str = "User"
    age: int
    gender: str
    state: str
    district: str
    occupation: str
    land_owner: bool = False
    land_acres: float = 0
    annual_income: str
    bank_account_changed: bool = False
    has_daughter: bool = False
    aadhaar: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None


class AadhaarLookup(BaseModel):
    aadhaar: str
    phone: Optional[str] = None


class EnrollmentCreate(BaseModel):
    scheme_id: str
    last_payment_date: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    occupation: Optional[str] = None
    land_owner: Optional[bool] = None
    land_acres: Optional[float] = None
    annual_income: Optional[str] = None
    bank_account_changed: Optional[bool] = None
    has_daughter: Optional[bool] = None
    aadhaar: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None


class AadhaarVerifyRequest(BaseModel):
    aadhaar: str
    phone: Optional[str] = None


class WhatsAppSendRequest(BaseModel):
    profile_id: int
    scheme_id: str
    alert_type: str = "lapsed"
    details: str = ""


class WhatsAppNotifyRequest(BaseModel):
    to: str
    message: str


class WhatsAppPhoneUpdate(BaseModel):
    profile_id: int
    phone: str


WHATSAPP_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "sarthi_verify_2024")
MOCK_AADHAAR_DATA = {
    "1234-5678-9012": {
        "name": "Mohan Singh",
        "age": 62,
        "dob": "1964-03-15",
        "gender": "male",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "phone": "9876543210",
    },
    "1111-2222-3333": {
        "name": "Priya Sharma",
        "age": 28,
        "dob": "1998-07-22",
        "gender": "female",
        "state": "Rajasthan",
        "district": "Jaipur",
        "phone": "8765432109",
    },
    "4444-5555-6666": {
        "name": "Ramesh Kumar",
        "age": 45,
        "dob": "1981-11-10",
        "gender": "male",
        "state": "Bihar",
        "district": "Patna",
        "phone": "7654321098",
    },
}


class SchemeSources(BaseModel):
    website: str = ""
    guideline_pdf: str = ""
    application_portal: str = ""
    helpline: str = ""
    csc_required: bool = False


class FeedbackCreate(BaseModel):
    profile_id: Optional[int] = None
    message: str
    rating: int = 0
    category: str = ''


class AIChatRequest(BaseModel):
    message: str
    page: str = ""
    scheme_id: Optional[str] = None


class LifeEventRequest(BaseModel):
    event: str


@app.on_event("startup")
def startup():
    try:
        init_db()
        print("[startup] init_db done")
    except Exception as e:
        print(f"[startup] init_db failed: {e}")
    try:
        seed_schemes()
        print("[startup] seed_schemes done")
    except Exception as e:
        import traceback
        print(f"[startup] seed_schemes failed: {e}")
        traceback.print_exc()
    try:
        seed_categories()
        print("[startup] seed_categories done")
    except Exception as e:
        print(f"[startup] seed_categories failed: {e}")


@app.get("/api/health")
def health():
    db_ok = False
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        pass
    pg_mode = os.environ.get("DATABASE_URL", "") != ""
    return {"status": "ok", "database": "connected" if db_ok else "error", "mode": "postgresql" if pg_mode else "sqlite"}


@app.get("/api/forms/{scheme_id}")
def get_scheme_form(scheme_id: str):
    form_path = FORMS_DIR / f"{scheme_id.replace('-', '_')}.json"
    if not form_path.exists():
        raise HTTPException(404, "Form not found for this scheme")
    with open(form_path, encoding="utf-8") as f:
        return json.load(f)


@app.post("/api/aadhaar/verify")
def verify_aadhaar(req: AadhaarVerifyRequest):
    raw = req.aadhaar.replace("-", "").replace(" ", "")
    if not raw.isdigit() or len(raw) != 12:
        raise HTTPException(400, "Invalid Aadhaar number")

    data = MOCK_AADHAAR_DATA.get(req.aadhaar) or MOCK_AADHAAR_DATA.get(raw)
    if not data:
        raise HTTPException(404, "Aadhaar not found in demo database")

    phone = req.phone or data["phone"]
    return {"verified": True, "data": {**data, "phone": phone, "aadhaar": req.aadhaar}}


@app.get("/api/schemes/search")
def search_schemes(q: str = "", category: str = "", occupation: str = ""):
    conn = get_connection()
    query = "SELECT * FROM schemes WHERE 1=1"
    params = []

    if q:
        query += " AND (name_en LIKE ? OR name_hi LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%"])
    if category:
        query += " AND category=?"
        params.append(category)
    if occupation:
        query += " AND eligibility LIKE ?"
        params.append(f"%{occupation}%")

    query += " ORDER BY name_en ASC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    results = []
    for r in rows:
        s = dict(r)
        s["eligibility"] = json.loads(s["eligibility"])
        s["lapse_triggers"] = json.loads(s["lapse_triggers"])
        s["documents"] = json.loads(s["documents"])
        s["form_fields"] = json.loads(s["form_fields"])
        s["sources"] = json.loads(s["sources"]) if isinstance(s["sources"], str) else s["sources"]
        results.append(s)
    return {"count": len(results), "results": results}


@app.get("/api/schemes/categories")
def get_categories():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM categories ORDER BY name_en").fetchall()
    conn.close()
    cats = [dict(r) for r in rows]
    return {"categories": cats}


@app.get("/api/schemes")
def get_schemes():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM schemes").fetchall()
    schemes = []
    for r in rows:
        s = dict(r)
        s["eligibility"] = json.loads(s["eligibility"])
        s["lapse_triggers"] = json.loads(s["lapse_triggers"])
        s["documents"] = json.loads(s["documents"])
        s["form_fields"] = json.loads(s["form_fields"])
        s["sources"] = json.loads(s["sources"]) if isinstance(s["sources"], str) else s["sources"]
        schemes.append(s)
    conn.close()
    return schemes


@app.get("/api/schemes/{scheme_id}")
def get_scheme(scheme_id: str):
    conn = get_connection()
    r = conn.execute("SELECT * FROM schemes WHERE id=?", (scheme_id,)).fetchone()
    conn.close()
    if not r:
        raise HTTPException(404, "Scheme not found")
    s = dict(r)
    s["eligibility"] = json.loads(s["eligibility"])
    s["lapse_triggers"] = json.loads(s["lapse_triggers"])
    s["documents"] = json.loads(s["documents"])
    s["form_fields"] = json.loads(s["form_fields"])
    s["sources"] = json.loads(s["sources"]) if isinstance(s["sources"], str) else s["sources"]
    return s


@app.post("/api/profile")
def create_profile(profile: ProfileCreate):
    conn = get_connection()
    cursor = conn.execute("""INSERT INTO profiles
        (name, age, gender, state, district, occupation, land_owner, land_acres, annual_income, bank_account_changed, has_daughter, aadhaar, phone, date_of_birth)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id""",
        (profile.name, profile.age, profile.gender, profile.state, profile.district,
         profile.occupation, int(profile.land_owner), profile.land_acres,
         profile.annual_income, int(profile.bank_account_changed), int(profile.has_daughter),
         profile.aadhaar, profile.phone, profile.date_of_birth))
    profile_id = cursor._cursor.fetchone()[0]
    conn.commit()
    conn.close()
    return {"profile_id": profile_id}


@app.post("/api/profile/lookup")
def profile_lookup(lookup: AadhaarLookup):
    conn = get_connection()
    r = conn.execute("SELECT * FROM profiles WHERE aadhaar=?", (lookup.aadhaar,)).fetchone()
    conn.close()
    if r:
        profile = dict(r)
        enroll_conn = get_connection()
        enrollments = enroll_conn.execute(
            "SELECT * FROM enrollments WHERE profile_id=?", (profile["id"],)
        ).fetchall()
        enroll_conn.close()
        return {"found": True, "profile": profile, "enrollments": [dict(e) for e in enrollments]}
    return {"found": False, "profile": None, "enrollments": []}


@app.get("/api/profile/{profile_id}")
def get_profile(profile_id: int):
    conn = get_connection()
    r = conn.execute("SELECT * FROM profiles WHERE id=?", (profile_id,)).fetchone()
    conn.close()
    if not r:
        raise HTTPException(404, "Profile not found")
    return dict(r)


@app.post("/api/profile/{profile_id}/enrollments")
def add_enrollment(profile_id: int, enrollment: EnrollmentCreate):
    conn = get_connection()
    conn.execute("""INSERT INTO enrollments (profile_id, scheme_id, last_payment_date)
        VALUES (?, ?, ?)""", (profile_id, enrollment.scheme_id, enrollment.last_payment_date))
    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.get("/api/profile/{profile_id}/enrollments")
def get_enrollments(profile_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM enrollments WHERE profile_id=?", (profile_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/profile/{profile_id}/scan")
def scan(profile_id: int):
    conn = get_connection()
    profile = conn.execute("SELECT * FROM profiles WHERE id=?", (profile_id,)).fetchone()
    if not profile:
        conn.close()
        raise HTTPException(404, "Profile not found")
    profile = dict(profile)
    profile["land_owner"] = bool(profile["land_owner"])
    profile["bank_account_changed"] = bool(profile["bank_account_changed"])

    scheme_rows = conn.execute("SELECT * FROM schemes").fetchall()
    enrollments = conn.execute("SELECT * FROM enrollments WHERE profile_id=?", (profile_id,)).fetchall()
    conn.close()

    schemes = []
    for r in scheme_rows:
        s = dict(r)
        s["eligibility"] = json.loads(s["eligibility"])
        s["lapse_triggers"] = json.loads(s["lapse_triggers"])
        s["documents"] = json.loads(s["documents"])
        s["form_fields"] = json.loads(s["form_fields"])
        s["sources"] = json.loads(s["sources"]) if isinstance(s["sources"], str) else s["sources"]
        schemes.append(s)

    enrollments_list = [dict(e) for e in enrollments]

    results = scan_profile(profile, schemes, enrollments_list)
    total = calculate_total_benefit(results)
    estimated_time = calculate_estimated_time(results)
    return {"results": results, "total_benefit": total, "estimated_time_minutes": estimated_time}


@app.post("/api/profile/{profile_id}/apply")
def apply_for_scheme(profile_id: int, scheme_id: str, form_data: dict = {}):
    conn = get_connection()
    scheme = conn.execute("SELECT * FROM schemes WHERE id=?", (scheme_id,)).fetchone()
    if not scheme:
        conn.close()
        raise HTTPException(404, "Scheme not found")
    cursor = conn.execute("""INSERT INTO applications (profile_id, scheme_id, status, stage, form_data)
        VALUES (?, ?, 'submitted', 0, ?) RETURNING id""",
        (profile_id, scheme_id, json.dumps(form_data, ensure_ascii=False)))
    app_id = cursor._cursor.fetchone()[0]
    conn.commit()

    scheme = dict(scheme)
    triggers = json.loads(scheme["lapse_triggers"])
    reminder_titles_hi = []
    for t in triggers:
        reminder_titles_hi.append(t["desc_hi"])

    conn.execute("""INSERT INTO reminders (profile_id, scheme_id, title_hi, title_en, due_days)
        VALUES (?, ?, ?, ?, ?)""",
        (profile_id, scheme_id,
         f"{scheme['name_hi']}: नवीनीकरण आवश्यक",
         f"{scheme['name_en']}: Renewal needed",
         scheme["renewal_period_days"]))
    conn.commit()
    conn.close()
    return {"application_id": app_id, "status": "submitted", "stage": 0}


@app.get("/api/profile/{profile_id}/applications")
def get_applications(profile_id: int):
    conn = get_connection()
    rows = conn.execute("""SELECT a.*, s.name_hi, s.name_en, s.benefit_amount
        FROM applications a JOIN schemes s ON a.scheme_id = s.id
        WHERE a.profile_id=? ORDER BY a.created_at DESC""", (profile_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/applications/{app_id}/advance")
def advance_application(app_id: int):
    stages = ["submitted", "verified", "at_block_office", "sanctioned", "benefit_restored"]
    conn = get_connection()
    app = conn.execute("SELECT * FROM applications WHERE id=?", (app_id,)).fetchone()
    if not app:
        conn.close()
        raise HTTPException(404, "Application not found")
    current_stage = app["stage"]
    if current_stage >= 4:
        conn.close()
        return {"status": "already_restored", "stage": 4}
    new_stage = current_stage + 1
    conn.execute("UPDATE applications SET stage=?, status=? WHERE id=?",
                 (new_stage, stages[new_stage], app_id))
    conn.commit()
    conn.close()
    return {"status": stages[new_stage], "stage": new_stage}


@app.get("/api/profile/{profile_id}/reminders")
def get_reminders(profile_id: int):
    conn = get_connection()
    rows = conn.execute("""SELECT r.*, s.name_hi, s.name_en
        FROM reminders r JOIN schemes s ON r.scheme_id = s.id
        WHERE r.profile_id=? ORDER BY r.due_days ASC""", (profile_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/profile/demo")
def load_demo():
    profile_id = seed_demo_profile()
    conn = get_connection()
    profile = conn.execute("SELECT * FROM profiles WHERE id=?", (profile_id,)).fetchone()
    conn.close()
    return {"profile_id": profile_id, "profile": dict(profile)}


@app.post("/api/profile/{profile_id}/enrollments/batch")
def add_enrollments_batch(profile_id: int, enrollments: List[EnrollmentCreate]):
    conn = get_connection()
    for e in enrollments:
        conn.execute("""INSERT INTO enrollments (profile_id, scheme_id, last_payment_date)
            VALUES (?, ?, ?)""", (profile_id, e.scheme_id, e.last_payment_date))
    conn.commit()
    conn.close()
    return {"status": "ok"}


STATES = [
    {"code": "ap", "name": "Andhra Pradesh", "name_hi": "आंध्र प्रदेश"},
    {"code": "ar", "name": "Arunachal Pradesh", "name_hi": "अरुणाचल प्रदेश"},
    {"code": "as", "name": "Assam", "name_hi": "असम"},
    {"code": "br", "name": "Bihar", "name_hi": "बिहार"},
    {"code": "cg", "name": "Chhattisgarh", "name_hi": "छत्तीसगढ़"},
    {"code": "ga", "name": "Goa", "name_hi": "गोवा"},
    {"code": "gj", "name": "Gujarat", "name_hi": "गुजरात"},
    {"code": "hr", "name": "Haryana", "name_hi": "हरियाणा"},
    {"code": "hp", "name": "Himachal Pradesh", "name_hi": "हिमाचल प्रदेश"},
    {"code": "jk", "name": "Jammu & Kashmir", "name_hi": "जम्मू और कश्मीर"},
    {"code": "jh", "name": "Jharkhand", "name_hi": "झारखंड"},
    {"code": "ka", "name": "Karnataka", "name_hi": "कर्नाटक"},
    {"code": "kl", "name": "Kerala", "name_hi": "केरल"},
    {"code": "mp", "name": "Madhya Pradesh", "name_hi": "मध्य प्रदेश"},
    {"code": "mh", "name": "Maharashtra", "name_hi": "महाराष्ट्र"},
    {"code": "mn", "name": "Manipur", "name_hi": "मणिपुर"},
    {"code": "ml", "name": "Meghalaya", "name_hi": "मेघालय"},
    {"code": "mz", "name": "Mizoram", "name_hi": "मिजोरम"},
    {"code": "nl", "name": "Nagaland", "name_hi": "नागालैंड"},
    {"code": "od", "name": "Odisha", "name_hi": "ओडिशा"},
    {"code": "pb", "name": "Punjab", "name_hi": "पंजाब"},
    {"code": "rj", "name": "Rajasthan", "name_hi": "राजस्थान"},
    {"code": "sk", "name": "Sikkim", "name_hi": "सिक्किम"},
    {"code": "tn", "name": "Tamil Nadu", "name_hi": "तमिलनाडु"},
    {"code": "ts", "name": "Telangana", "name_hi": "तेलंगाना"},
    {"code": "tr", "name": "Tripura", "name_hi": "त्रिपुरा"},
    {"code": "up", "name": "Uttar Pradesh", "name_hi": "उत्तर प्रदेश"},
    {"code": "uk", "name": "Uttarakhand", "name_hi": "उत्तराखंड"},
    {"code": "wb", "name": "West Bengal", "name_hi": "पश्चिम बंगाल"},
    {"code": "an", "name": "Andaman & Nicobar", "name_hi": "अंडमान और निकोबार"},
    {"code": "ch", "name": "Chandigarh", "name_hi": "चंडीगढ़"},
    {"code": "dn", "name": "Dadra & Nagar Haveli", "name_hi": "दादरा और नगर हवेली"},
    {"code": "dd", "name": "Daman & Diu", "name_hi": "दमन और दीव"},
    {"code": "ld", "name": "Lakshadweep", "name_hi": "लक्षद्वीप"},
    {"code": "dl", "name": "Delhi", "name_hi": "दिल्ली"},
    {"code": "py", "name": "Puducherry", "name_hi": "पुडुचेरी"},
    {"code": "la", "name": "Ladakh", "name_hi": "लद्दाख"},
]

OCCUPATIONS = [
    {"id": "farmer", "name_hi": "किसान", "name_en": "Farmer", "icon": "🌾"},
    {"id": "student", "name_hi": "विद्यार्थी", "name_en": "Student", "icon": "📚"},
    {"id": "worker", "name_hi": "मज़दूर", "name_en": "Worker", "icon": "🔧"},
    {"id": "senior", "name_hi": "वरिष्ठ नागरिक", "name_en": "Senior Citizen", "icon": "👴"},
    {"id": "self-employed", "name_hi": "स्व-रोज़गार", "name_en": "Self-Employed", "icon": "💼"},
    {"id": "housewife", "name_hi": "गृहिणी", "name_en": "Housewife", "icon": "🏠"},
    {"id": "professional", "name_hi": "पेशेवर", "name_en": "Professional", "icon": "👨‍⚕️"},
    {"id": "unemployed", "name_hi": "बेरोज़गार", "name_en": "Unemployed", "icon": "🔍"},
]

INCOME_BRACKETS = [
    {"id": "0-50000", "label_hi": "₹0 – ₹50,000", "label_en": "₹0 – ₹50,000"},
    {"id": "50000-100000", "label_hi": "₹50,000 – ₹1,00,000", "label_en": "₹50,000 – ₹1,00,000"},
    {"id": "100000-200000", "label_hi": "₹1,00,000 – ₹2,00,000", "label_en": "₹1,00,000 – ₹2,00,000"},
    {"id": "200000-500000", "label_hi": "₹2,00,000 – ₹5,00,000", "label_en": "₹2,00,000 – ₹5,00,000"},
    {"id": "500000+", "label_hi": "₹5,00,000 से अधिक", "label_en": "₹5,00,000+"},
]

GENDERS = [
    {"id": "male", "name_hi": "पुरुष", "name_en": "Male"},
    {"id": "female", "name_hi": "महिला", "name_en": "Female"},
    {"id": "other", "name_hi": "अन्य", "name_en": "Other"},
]


@app.get("/api/states")
def get_states():
    return {"states": STATES}


@app.get("/api/occupations")
def get_occupations():
    return {"occupations": OCCUPATIONS}


@app.get("/api/income-brackets")
def get_income_brackets():
    return {"income_brackets": INCOME_BRACKETS}


@app.get("/api/genders")
def get_genders():
    return {"genders": GENDERS}


@app.put("/api/profile/{profile_id}")
def update_profile(profile_id: int, profile: ProfileUpdate):
    conn = get_connection()
    existing = conn.execute("SELECT * FROM profiles WHERE id=?", (profile_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "Profile not found")

    fields = []
    values = []
    for field in ["name", "age", "gender", "state", "district", "occupation",
                   "annual_income", "has_daughter", "aadhaar", "phone", "date_of_birth"]:
        val = getattr(profile, field, None)
        if val is not None:
            fields.append(f"{field}=?")
            values.append(val)

    for field in ["land_owner", "bank_account_changed"]:
        val = getattr(profile, field, None)
        if val is not None:
            fields.append(f"{field}=?")
            values.append(int(val))

    if profile.land_acres is not None:
        fields.append("land_acres=?")
        values.append(profile.land_acres)

    if not fields:
        conn.close()
        return {"status": "no_changes"}

    values.append(profile_id)
    conn.execute(f"UPDATE profiles SET {', '.join(fields)} WHERE id=?", values)
    conn.commit()
    updated = conn.execute("SELECT * FROM profiles WHERE id=?", (profile_id,)).fetchone()
    conn.close()
    return {"status": "ok", "profile": dict(updated)}


@app.delete("/api/profile/{profile_id}/enrollments/{enrollment_id}")
def delete_enrollment(profile_id: int, enrollment_id: int):
    conn = get_connection()
    existing = conn.execute("SELECT * FROM enrollments WHERE id=? AND profile_id=?",
                            (enrollment_id, profile_id)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "Enrollment not found")
    conn.execute("DELETE FROM enrollments WHERE id=? AND profile_id=?", (enrollment_id, profile_id))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


@app.post("/api/feedback")
def submit_feedback(feedback: FeedbackCreate):
    conn = get_connection()
    conn.execute("""INSERT INTO feedback (profile_id, message, rating, category)
        VALUES (?, ?, ?, ?)""",
        (feedback.profile_id, feedback.message, feedback.rating, feedback.category))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Thank you for your feedback!"}


@app.post("/api/whatsapp/send")
def whatsapp_send_alert(req: WhatsAppSendRequest):
    conn = get_connection()
    profile = conn.execute("SELECT * FROM profiles WHERE id=?", (req.profile_id,)).fetchone()
    scheme = conn.execute("SELECT name_en, name_hi FROM schemes WHERE id=?", (req.scheme_id,)).fetchone()
    conn.close()

    if not profile or not scheme:
        raise HTTPException(404, "Profile or scheme not found")

    phone = profile["phone"]
    if not phone:
        raise HTTPException(400, "Profile has no phone number")

    scheme_name = scheme["name_en"]
    profile_name = profile["name"]

    result = send_scheme_alert(phone, profile_name, scheme_name, req.alert_type, req.details)
    return {"phone": phone, "scheme": scheme_name, **result}


@app.post("/api/whatsapp/notify")
def whatsapp_notify(req: WhatsAppNotifyRequest):
    result = send_whatsapp(req.to, req.message)
    return result


@app.post("/api/whatsapp/phone")
def whatsapp_update_phone(req: WhatsAppPhoneUpdate):
    conn = get_connection()
    existing = conn.execute("SELECT * FROM profiles WHERE id=?", (req.profile_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "Profile not found")
    conn.execute("UPDATE profiles SET phone=? WHERE id=?", (req.phone, req.profile_id))
    conn.commit()
    conn.close()
    return {"status": "ok", "phone": req.phone}


@app.get("/api/whatsapp/log")
def whatsapp_log():
    from whatsapp_service import WHATSAPP_LOG
    return {"log": WHATSAPP_LOG}


@app.get("/api/whatsapp/webhook")
async def whatsapp_webhook_verify(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        return int(challenge)
    raise HTTPException(403, "Verification failed")


@app.post("/api/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    body = await request.json()
    entry = body.get("entry", [{}])[0]
    change = entry.get("changes", [{}])[0]
    value = change.get("value", {})
    messages = value.get("messages", [])

    for msg in messages:
        if msg.get("type") == "text":
            from_number = msg.get("from", "")
            text = msg.get("text", {}).get("body", "")

            conn = get_connection()
            profile = conn.execute("SELECT * FROM profiles WHERE phone=?", (from_number,)).fetchone()
            conn.close()

            context = {}
            if profile:
                p = dict(profile)
                enroll_conn = get_connection()
                enrollments = enroll_conn.execute(
                    "SELECT * FROM enrollments WHERE profile_id=?", (p["id"],)
                ).fetchall()
                enroll_conn.close()
                schemes_rows = get_connection().execute("SELECT * FROM schemes").fetchall()
                get_connection().close()

                schemes = []
                for r in schemes_rows:
                    s = dict(r)
                    for f in ["eligibility", "lapse_triggers", "documents", "form_fields"]:
                        try: s[f] = json.loads(s[f])
                        except: s[f] = []
                    schemes.append(s)
                results = scan_profile(p, schemes, [dict(e) for e in enrollments])
                context = {
                    "name": p["name"], "age": p["age"], "state": p["state"],
                    "district": p["district"], "occupation": p["occupation"],
                    "land_owner": p["land_owner"], "land_acres": p["land_acres"],
                    "annual_income": p["annual_income"],
                    "scan_results": results, "current_page": "whatsapp",
                }

            reply = ai_chat(0, text, context)
            reply_text = reply.get("message", "I'm here to help with your schemes!")
            send_whatsapp(f"whatsapp:{from_number}", reply_text)

    return {"status": "ok"}


@app.get("/api/dashboard/summary")
def dashboard_summary():
    conn = get_connection()
    total_schemes = conn.execute("SELECT COUNT(*) FROM schemes").fetchone()[0]
    total_profiles = conn.execute("SELECT COUNT(*) FROM profiles").fetchone()[0]
    total_applications = conn.execute("SELECT COUNT(*) FROM applications").fetchone()[0]
    total_feedback = conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]

    stage_counts = conn.execute(
        "SELECT stage, COUNT(*) as cnt FROM applications GROUP BY stage ORDER BY stage"
    ).fetchall()

    schemes_with_apply_url = conn.execute(
        "SELECT COUNT(*) FROM schemes WHERE apply_url != '' AND apply_url IS NOT NULL"
    ).fetchone()[0]

    conn.close()
    return {
        "total_schemes": total_schemes,
        "total_profiles": total_profiles,
        "total_applications": total_applications,
        "total_feedback": total_feedback,
        "applications_by_stage": [{"stage": r["stage"], "count": r["cnt"]} for r in stage_counts],
        "schemes_with_apply_url": schemes_with_apply_url,
    }


@app.get("/api/ai/status")
def ai_status():
    return {"available": ai_available(), "model": "gemini-2.0-flash" if ai_available() else None}


@app.post("/api/ai/chat")
def ai_chat_endpoint(profile_id: int, req: AIChatRequest):
    conn = get_connection()
    profile = conn.execute("SELECT * FROM profiles WHERE id=?", (profile_id,)).fetchone()
    if not profile:
        conn.close()
        raise HTTPException(404, "Profile not found")
    
    from rules_engine import scan_profile, calculate_total_benefit
    schemes_rows = conn.execute("SELECT * FROM schemes").fetchall()
    enrollments = conn.execute("SELECT * FROM enrollments WHERE profile_id=?", (profile_id,)).fetchall()
    conn.close()
    
    schemes = []
    for r in schemes_rows:
        s = dict(r)
        for field in ["eligibility", "lapse_triggers", "documents", "form_fields"]:
            try:
                s[field] = json.loads(s[field])
            except:
                s[field] = []
        schemes.append(s)
    
    profile_dict = dict(profile)
    profile_dict["land_owner"] = bool(profile_dict["land_owner"])
    profile_dict["bank_account_changed"] = bool(profile_dict["bank_account_changed"])
    enrollments_list = [dict(e) for e in enrollments]
    
    scan_results = scan_profile(profile_dict, schemes, enrollments_list)
    
    context = {
        **profile_dict,
        "scan_results": scan_results,
        "current_page": req.page,
        "current_scheme": req.scheme_id or "",
    }
    
    result = ai_chat(profile_id, req.message, context)
    return result


@app.post("/api/ai/life-event")
def ai_life_event(profile_id: int, req: LifeEventRequest):
    conn = get_connection()
    profile = conn.execute("SELECT * FROM profiles WHERE id=?", (profile_id,)).fetchone()
    conn.close()
    if not profile:
        raise HTTPException(404, "Profile not found")
    
    profile_dict = dict(profile)
    profile_dict["land_owner"] = bool(profile_dict["land_owner"])
    profile_dict["bank_account_changed"] = bool(profile_dict["bank_account_changed"])
    
    result = process_life_event(profile_id, req.event, profile_dict)
    return result


@app.post("/api/ai/action-plan")
def ai_action_plan(profile_id: int):
    conn = get_connection()
    profile = conn.execute("SELECT * FROM profiles WHERE id=?", (profile_id,)).fetchone()
    if not profile:
        conn.close()
        raise HTTPException(404, "Profile not found")
    
    from rules_engine import scan_profile, calculate_total_benefit
    schemes_rows = conn.execute("SELECT * FROM schemes").fetchall()
    enrollments = conn.execute("SELECT * FROM enrollments WHERE profile_id=?", (profile_id,)).fetchall()
    conn.close()
    
    schemes = []
    for r in schemes_rows:
        s = dict(r)
        for field in ["eligibility", "lapse_triggers", "documents", "form_fields"]:
            try:
                s[field] = json.loads(s[field])
            except:
                s[field] = []
        schemes.append(s)
    
    profile_dict = dict(profile)
    profile_dict["land_owner"] = bool(profile_dict["land_owner"])
    profile_dict["bank_account_changed"] = bool(profile_dict["bank_account_changed"])
    enrollments_list = [dict(e) for e in enrollments]
    
    scan_results_list = scan_profile(profile_dict, schemes, enrollments_list)
    
    result = generate_action_plan(profile_id, scan_results_list)
    return result


SCRAPE_STATUS = {"last_run": None, "schemes_added": 0, "errors": []}


@app.post("/api/scrape")
def trigger_scrape():
    global SCRAPE_STATUS
    try:
        results, errors = scrape_all_schemes()
        if results:
            count = import_to_database(results)
            SCRAPE_STATUS = {
                "last_run": str(datetime.utcnow()),
                "schemes_added": count,
                "errors": errors
            }
            return {"status": "ok", "schemes_added": count, "errors": errors}
        return {"status": "ok", "schemes_added": 0, "errors": errors}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/api/scrape/status")
def scrape_status():
    return SCRAPE_STATUS


@app.post("/api/scrape/discover")
def discover_new_slugs():
    from scraper import VERIFIED_SLUGS
    import requests
    api_key = os.environ.get("SCRAPE_API_KEY", "")
    if not api_key:
        return {"discovered": [], "count": 0, "error": "SCRAPE_API_KEY not set"}
    headers = {'User-Agent': 'Mozilla/5.0', 'x-api-key': api_key}
    base = 'https://api.myscheme.gov.in/schemes/v6/public/schemes'

    discovered = []
    prefixes = ['pm-', 'nsp', 'up-', 'national-', 'pradhan-mantri-', 'day-']
    words = ['kisan', 'education', 'health', 'housing', 'women', 'child',
             'mission', 'yojana', 'pension', 'credit', 'skill', 'gram',
             'shakti', 'suraksha', 'vishwakarma', 'digital', 'sagar',
             'jal', 'awas', 'shram', 'bharat', 'krishi', 'vridha',
             'kanya', 'scholarship', 'bima']

    for prefix in prefixes:
        for word in words:
            slug = f"{prefix}{word}".strip('-').lower()
            if slug not in VERIFIED_SLUGS:
                try:
                    r = requests.get(base, params={'slug': slug, 'lang': 'en'},
                                     headers=headers, timeout=10)
                    if r.status_code == 200:
                        data = r.json()
                        if data.get('data') and data['data'].get('_id'):
                            discovered.append(slug)
                except:
                    pass

    return {"discovered": discovered, "count": len(discovered)}


# ──────────────────────────────────────────────
# Serve frontend static files (must be after all API routes)
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    from fastapi.responses import FileResponse
    import mimetypes
    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("text/css", ".css")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = FRONTEND_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIR / "index.html"))
