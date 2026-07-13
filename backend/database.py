import sqlite3
import os
import json

DATABASE_URL = os.environ.get("DATABASE_URL", "")
DB_PATH = os.path.join(os.path.dirname(__file__), "scheme_sarthi.db")


class _Row(dict):
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return dict.__getitem__(self, key)


class _PGCursor:
    def __init__(self, cursor, pg_conn, sql):
        self._cursor = cursor
        self.lastrowid = None
        sql_upper = sql.strip().upper()
        if sql_upper.startswith("INSERT") and "DO NOTHING" not in sql_upper:
            try:
                c = pg_conn.cursor()
                c.execute("SELECT LASTVAL()")
                row = c.fetchone()
                self.lastrowid = list(row.values())[0] if row else None
            except Exception:
                pass

    def fetchone(self):
        row = self._cursor.fetchone()
        return _Row(row) if row else None

    def fetchall(self):
        return [_Row(r) for r in self._cursor.fetchall()]


class _PGConnection:
    def __init__(self, dsn):
        self._dsn = dsn
        self._conn = None

    def _ensure_conn(self):
        if self._conn is None:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            self._conn = psycopg2.connect(self._dsn, cursor_factory=RealDictCursor)

    def _sql(self, sql):
        sql = sql.replace("?", "%s")
        if sql.strip().upper().startswith("INSERT OR REPLACE INTO"):
            import re
            m = re.match(
                r"INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)",
                sql, re.IGNORECASE
            )
            if m:
                table = m.group(1)
                cols = [c.strip() for c in m.group(2).split(",")]
                updates = ", ".join(f"{c}=EXCLUDED.{c}" for c in cols)
                return f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({m.group(3)}) ON CONFLICT (id) DO UPDATE SET {updates}"
        if sql.strip().upper().startswith("INSERT OR IGNORE INTO"):
            sql = sql.replace("INSERT OR IGNORE INTO", "INSERT INTO")
            sql += " ON CONFLICT DO NOTHING"
        return sql

    def execute(self, sql, params=None):
        self._ensure_conn()
        sql = self._sql(sql)
        cur = self._conn.cursor()
        if params is not None:
            cur.execute(sql, params)
        else:
            cur.execute(sql)
        return _PGCursor(cur, self._conn, sql)

    def executescript(self, sql):
        self._ensure_conn()
        old = self._conn.autocommit
        self._conn.autocommit = True
        try:
            for stmt in sql.split(";"):
                s = stmt.strip()
                if s:
                    s = s.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
                    s = s.replace("AUTOINCREMENT", "")
                    try:
                        self._conn.cursor().execute(s)
                    except Exception as e:
                        self._conn.rollback()
        finally:
            self._conn.autocommit = old

    def commit(self):
        self._ensure_conn()
        self._conn.commit()

    def close(self):
        if self._conn:
            self._conn.close()


def is_postgres():
    return bool(DATABASE_URL)


def get_connection():
    if DATABASE_URL:
        return _PGConnection(DATABASE_URL)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS schemes (
            id TEXT PRIMARY KEY,
            name_hi TEXT NOT NULL,
            name_en TEXT NOT NULL,
            benefit_amount TEXT NOT NULL,
            benefit_period TEXT DEFAULT 'वर्ष',
            eligibility TEXT NOT NULL,
            renewal_period_days INTEGER DEFAULT 365,
            lapse_triggers TEXT NOT NULL,
            documents TEXT NOT NULL,
            apply_url TEXT DEFAULT '',
            form_fields TEXT NOT NULL,
            category TEXT DEFAULT '',
            sources TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT DEFAULT 'User',
            age INTEGER,
            gender TEXT,
            state TEXT,
            district TEXT,
            occupation TEXT,
            land_owner INTEGER DEFAULT 0,
            land_acres REAL DEFAULT 0,
            annual_income TEXT,
            bank_account_changed INTEGER DEFAULT 0,
            has_daughter INTEGER DEFAULT 0,
            aadhaar TEXT UNIQUE,
            phone TEXT,
            date_of_birth TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER NOT NULL,
            scheme_id TEXT NOT NULL,
            last_payment_date TEXT,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (profile_id) REFERENCES profiles(id),
            FOREIGN KEY (scheme_id) REFERENCES schemes(id)
        );

        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER NOT NULL,
            scheme_id TEXT NOT NULL,
            status TEXT DEFAULT 'submitted',
            stage INTEGER DEFAULT 0,
            form_data TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_id) REFERENCES profiles(id),
            FOREIGN KEY (scheme_id) REFERENCES schemes(id)
        );

        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER NOT NULL,
            scheme_id TEXT NOT NULL,
            title_hi TEXT NOT NULL,
            title_en TEXT NOT NULL,
            due_days INTEGER,
            notification_sent INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_id) REFERENCES profiles(id),
            FOREIGN KEY (scheme_id) REFERENCES schemes(id)
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER,
            message TEXT NOT NULL,
            rating INTEGER DEFAULT 0,
            category TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name_hi TEXT NOT NULL,
            name_en TEXT NOT NULL,
            icon TEXT DEFAULT ''
        );
    """)

    if is_postgres():
        try:
            conn.execute("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth TEXT")
        except Exception:
            pass
    else:
        try:
            conn.execute("ALTER TABLE profiles ADD COLUMN date_of_birth TEXT")
        except sqlite3.OperationalError:
            pass

    conn.commit()
    conn.close()


def seed_categories():
    conn = get_connection()
    existing = conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
    if existing > 0:
        conn.close()
        return

    cats = [
        ("agriculture", "कृषि, ग्रामीण और पर्यावरण", "Agriculture, Rural & Environment", "🌾"),
        ("banking", "बैंकिंग, वित्तीय सेवाएं और बीमा", "Banking, Financial Services & Insurance", "🏦"),
        ("business", "व्यवसाय और उद्यमिता", "Business & Entrepreneurship", "💼"),
        ("education", "शिक्षा और सीखना", "Education & Learning", "📚"),
        ("health", "स्वास्थ्य और कल्याण", "Health & Wellness", "🏥"),
        ("housing", "आवास और आश्रय", "Housing & Shelter", "🏠"),
        ("social-welfare", "सामाजिक कल्याण और सशक्तिकरण", "Social Welfare & Empowerment", "🤝"),
        ("skills", "कौशल और रोजगार", "Skills & Employment", "🔧"),
        ("women-child", "महिला और बाल", "Women and Child", "👩‍👧"),
        ("sports", "खेल और संस्कृति", "Sports & Culture", "🎭"),
        ("infrastructure", "परिवहन और बुनियादी ढांचा", "Transport & Infrastructure", "🚂"),
        ("science-it", "विज्ञान, आईटी और संचार", "Science, IT & Communications", "💻"),
        ("travel", "यात्रा और पर्यटन", "Travel & Tourism", "✈️"),
        ("sanitation", "उपयोगिता और स्वच्छता", "Utility & Sanitation", "🧹"),
        ("public-safety", "सार्वजनिक सुरक्षा, कानून और न्याय", "Public Safety, Law & Justice", "⚖️"),
        ("pension", "पेंशन और वरिष्ठ नागरिक", "Pension & Senior Citizens", "👴"),
        ("farmer", "किसान कल्याण", "Farmer Welfare", "🚜"),
        ("student", "छात्र कल्याण", "Student Welfare", "🎓"),
    ]
    for cid, nhi, nen, icon in cats:
        conn.execute("INSERT OR IGNORE INTO categories (id, name_hi, name_en, icon) VALUES (?, ?, ?, ?)",
                     (cid, nhi, nen, icon))
    conn.commit()
    conn.close()


def seed_schemes():
    conn = get_connection()
    existing = conn.execute("SELECT COUNT(*) FROM schemes").fetchone()[0]
    if existing > 0:
        conn.close()
        return

    schemes = [
        {
            "id": "pm-kisan",
            "name_hi": "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
            "name_en": "PM-KISAN Samman Nidhi",
            "benefit_amount": "₹6,000/वर्ष",
            "benefit_period": "वर्ष",
            "eligibility": json.dumps([
                {"field": "occupation", "operator": "in", "value": ["farmer"]},
                {"field": "land_owner", "operator": "eq", "value": True},
                {"field": "annual_income", "operator": "lte", "value": "200000"}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "ekyc_missed", "desc_hi": "eKYC नहीं कराया", "desc_en": "eKYC not completed"},
                {"type": "payment_gap", "desc_hi": "2 से अधिक किस्त नहीं मिली", "desc_en": "2+ installments missed", "days": 180},
                {"type": "bank_account_changed", "desc_hi": "बैंक खाता बदला गया", "desc_en": "Bank account changed"}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "भूमि रिकॉर्ड / खतौनी (Land Record)",
                "बैंक खाता विवरण (Bank Account Details)",
                "मोबाइल नंबर (Mobile Number)"
            ]),
            "apply_url": "https://pmkisan.gov.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
                {"name": "ifsc", "label_hi": "IFSC कोड", "label_en": "IFSC Code", "type": "text"},
                {"name": "mobile", "label_hi": "मोबाइल नंबर", "label_en": "Mobile Number", "type": "tel"},
                {"name": "land_khasra", "label_hi": "खसरा संख्या", "label_en": "Khasra Number", "type": "text"}
            ])
        },
        {
            "id": "pm-fasal-bima",
            "name_hi": "प्रधानमंत्री फसल बीमा योजना",
            "name_en": "PM Fasal Bima Yojana",
            "benefit_amount": "₹50,000/वर्ष (अधिकतम)",
            "benefit_period": "वर्ष",
            "eligibility": json.dumps([
                {"field": "occupation", "operator": "in", "value": ["farmer"]},
                {"field": "land_owner", "operator": "eq", "value": True}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "renewal_missed", "desc_hi": "नवीनीकरण नहीं कराया", "desc_en": "Renewal not done"},
                {"type": "payment_gap", "desc_hi": "प्रीमियम भुगतान नहीं", "desc_en": "Premium not paid", "days": 365}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "भूमि रिकॉर्ड (Land Record)",
                "बैंक खाता (Bank Account)",
                "फसल बीमा पॉलिसी (Crop Insurance Policy)"
            ]),
            "apply_url": "https://pmfby.gov.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "policy_no", "label_hi": "पॉलिसी नंबर", "label_en": "Policy Number", "type": "text"},
                {"name": "crop", "label_hi": "फसल का नाम", "label_en": "Crop Name", "type": "text"},
                {"name": "area", "label_hi": "रकबा (हेक्टेयर)", "label_en": "Area (Hectares)", "type": "number"}
            ])
        },
        {
            "id": "ayushman-bharat",
            "name_hi": "आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना",
            "name_en": "Ayushman Bharat PM-JAY",
            "benefit_amount": "₹5,00,000/वर्ष (स्वास्थ्य कवर)",
            "benefit_period": "वर्ष",
            "eligibility": json.dumps([
                {"field": "annual_income", "operator": "lte", "value": "150000"}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "renewal_missed", "desc_hi": "कार्ड नवीनीकरण नहीं", "desc_en": "Card renewal due"},
                {"type": "ekyc_missed", "desc_hi": "eKYC अपडेट नहीं", "desc_en": "eKYC not updated"}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "बीपीएल राशन कार्ड (BPL Ration Card)",
                "परिवार पहचान पत्र (Family ID)",
                "पासपोर्ट साइज़ फोटो (Passport Photo)"
            ]),
            "apply_url": "https://pmjay.gov.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "ration_card", "label_hi": "राशन कार्ड संख्या", "label_en": "Ration Card Number", "type": "text"},
                {"name": "family_id", "label_hi": "परिवार ID", "label_en": "Family ID", "type": "text"}
            ])
        },
        {
            "id": "vridha-pension-up",
            "name_hi": "वृद्धा पेंशन योजना (उत्तर प्रदेश)",
            "name_en": "Vridha Pension Yojana (Uttar Pradesh)",
            "benefit_amount": "₹500/माह",
            "benefit_period": "माह",
            "eligibility": json.dumps([
                {"field": "age", "operator": "gte", "value": 60},
                {"field": "state", "operator": "eq", "value": "Uttar Pradesh"},
                {"field": "annual_income", "operator": "lte", "value": "100000"}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "renewal_missed", "desc_hi": "जीवन प्रमाण पत्र नहीं दिया", "desc_en": "Life certificate not submitted"},
                {"type": "bank_account_changed", "desc_hi": "बैंक खाता बदला", "desc_en": "Bank account changed"}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "आयु प्रमाण पत्र (Age Proof)",
                "बैंक खाता (Bank Account)",
                "पासपोर्ट साइज़ फोटो (Passport Photo)",
                "निवास प्रमाण पत्र (Residence Proof)"
            ]),
            "apply_url": "https://socialwelfare.up.gov.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
                {"name": "ifsc", "label_hi": "IFSC कोड", "label_en": "IFSC Code", "type": "text"},
                {"name": "age_proof", "label_hi": "आयु प्रमाण (दस्तावेज़)", "label_en": "Age Proof Document", "type": "text"}
            ])
        },
        {
            "id": "nsp",
            "name_hi": "राष्ट्रीय छात्रवृत्ति पोर्टल",
            "name_en": "National Scholarship Portal",
            "benefit_amount": "₹5,000-₹20,000/वर्ष",
            "benefit_period": "वर्ष",
            "eligibility": json.dumps([
                {"field": "occupation", "operator": "in", "value": ["student"]},
                {"field": "annual_income", "operator": "lte", "value": "250000"}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "renewal_missed", "desc_hi": "नवीनीकरण आवेदन नहीं", "desc_en": "Renewal application not done"},
                {"type": "ekyc_missed", "desc_hi": "संस्थान द्वारा सत्यापन बाकी", "desc_en": "Institute verification pending"}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "पिछली कक्षा की अंकपत्र (Marksheet)",
                "आय प्रमाण पत्र (Income Certificate)",
                "बैंक खाता (Bank Account)",
                "संस्थान पहचान पत्र (Institute ID)"
            ]),
            "apply_url": "https://scholarships.gov.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
                {"name": "institute_code", "label_hi": "संस्थान कोड", "label_en": "Institute Code", "type": "text"},
                {"name": "class", "label_hi": "कक्षा", "label_en": "Class", "type": "text"}
            ])
        },
        {
            "id": "pm-ujjwala",
            "name_hi": "प्रधानमंत्री उज्ज्वला योजना",
            "name_en": "PM Ujjwala Yojana",
            "benefit_amount": "₹1,600/सिलेंडर (सब्सिडी)",
            "benefit_period": "सिलेंडर",
            "eligibility": json.dumps([
                {"field": "annual_income", "operator": "lte", "value": "120000"},
                {"field": "occupation", "operator": "nin", "value": ["student"]}
            ]),
            "renewal_period_days": 730,
            "lapse_triggers": json.dumps([
                {"type": "ekyc_missed", "desc_hi": "eKYC अपडेट नहीं", "desc_en": "eKYC not updated"},
                {"type": "bank_account_changed", "desc_hi": "बैंक खाता बदला", "desc_en": "Bank account changed"}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "बीपीएल राशन कार्ड (BPL Ration Card)",
                "बैंक खाता (Bank Account)",
                "पासपोर्ट साइज़ फोटो (Passport Photo)"
            ]),
            "apply_url": "https://pmujjwalayojana.com",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "ration_card", "label_hi": "राशन कार्ड संख्या", "label_en": "Ration Card Number", "type": "text"},
                {"name": "gas_agency", "label_hi": "गैस एजेंसी", "label_en": "Gas Agency", "type": "text"},
                {"name": "consumer_no", "label_hi": "उपभोक्ता संख्या", "label_en": "Consumer Number", "type": "text"}
            ])
        },
        {
            "id": "pm-awas-gramin",
            "name_hi": "प्रधानमंत्री आवास योजना - ग्रामीण",
            "name_en": "PM Awas Yojana - Gramin",
            "benefit_amount": "₹1,20,000 (एकमुश्त)",
            "benefit_period": "एकमुश्त",
            "eligibility": json.dumps([
                {"field": "land_owner", "operator": "eq", "value": True},
                {"field": "annual_income", "operator": "lte", "value": "150000"},
                {"field": "occupation", "operator": "in", "value": ["farmer", "worker"]}
            ]),
            "renewal_period_days": 730,
            "lapse_triggers": json.dumps([
                {"type": "ekyc_missed", "desc_hi": "सत्यापन लंबित", "desc_en": "Verification pending"}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "भूमि रिकॉर्ड (Land Record)",
                "आय प्रमाण पत्र (Income Certificate)",
                "बैंक खाता (Bank Account)",
                "बीपीएल सूची (BPL List)"
            ]),
            "apply_url": "https://pmayg.nic.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "land_khasra", "label_hi": "खसरा संख्या", "label_en": "Khasra Number", "type": "text"},
                {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
                {"name": "ifsc", "label_hi": "IFSC कोड", "label_en": "IFSC Code", "type": "text"}
            ])
        },
        {
            "id": "atal-pension",
            "name_hi": "अटल पेंशन योजना",
            "name_en": "Atal Pension Yojana",
            "benefit_amount": "₹1,000-₹5,000/माह (पेंशन)",
            "benefit_period": "माह",
            "eligibility": json.dumps([
                {"field": "age", "operator": "gte", "value": 18},
                {"field": "age", "operator": "lte", "value": 40},
                {"field": "bank_account_changed", "operator": "any", "value": []}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "payment_gap", "desc_hi": "प्रीमियम जमा नहीं", "desc_en": "Premium not deposited", "days": 180}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "बैंक खाता (Bank Account)",
                "पासपोर्ट साइज़ फोटो (Passport Photo)",
                "मोबाइल नंबर (Mobile Number)"
            ]),
            "apply_url": "https://npscra.nsdl.co.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
                {"name": "ifsc", "label_hi": "IFSC कोड", "label_en": "IFSC Code", "type": "text"},
                {"name": "pension_amount", "label_hi": "पेंशन राशि", "label_en": "Pension Amount", "type": "select", "options": ["1000", "2000", "3000", "4000", "5000"]}
            ])
        },
        {
            "id": "pm-shram-yogi",
            "name_hi": "प्रधानमंत्री श्रम योगी मानधन",
            "name_en": "PM Shram Yogi Maandhan",
            "benefit_amount": "₹3,000/माह (पेंशन)",
            "benefit_period": "माह",
            "eligibility": json.dumps([
                {"field": "occupation", "operator": "in", "value": ["worker"]},
                {"field": "age", "operator": "gte", "value": 18},
                {"field": "age", "operator": "lte", "value": 40},
                {"field": "annual_income", "operator": "lte", "value": "15000"}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "payment_gap", "desc_hi": "योगदान जमा नहीं", "desc_en": "Contribution not paid", "days": 180}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "बैंक खाता (Bank Account)",
                "आय प्रमाण पत्र (Income Certificate)",
                "पासपोर्ट साइज़ फोटो (Passport Photo)"
            ]),
            "apply_url": "https://maandhan.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
                {"name": "ifsc", "label_hi": "IFSC कोड", "label_en": "IFSC Code", "type": "text"},
                {"name": "occupation_type", "label_hi": "व्यवसाय", "label_en": "Occupation Type", "type": "text"}
            ])
        },
        {
            "id": "sukanya-samriddhi",
            "name_hi": "सुकन्या समृद्धि योजना",
            "name_en": "Sukanya Samriddhi Yojana",
            "benefit_amount": "₹1,000-₹1,50,000/वर्ष (जमा)",
            "benefit_period": "वर्ष",
            "eligibility": json.dumps([
                {"field": "occupation", "operator": "in", "value": ["farmer", "worker", "senior"]},
                {"field": "has_daughter", "operator": "eq", "value": True}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "payment_gap", "desc_hi": "जमा नहीं किया", "desc_en": "Deposit not made", "days": 365}
            ]),
            "documents": json.dumps([
                "बेटी का जन्म प्रमाण पत्र (Birth Certificate)",
                "आधार कार्ड (Aadhaar Card)",
                "बैंक खाता (Bank Account)",
                "अभिभावक का आधार (Parent's Aadhaar)"
            ]),
            "apply_url": "https://www.indiapost.gov.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "अभिभावक का आधार", "label_en": "Parent's Aadhaar", "type": "text"},
                {"name": "girl_aadhaar", "label_hi": "बेटी का आधार", "label_en": "Daughter's Aadhaar", "type": "text"},
                {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
                {"name": "deposit_amount", "label_hi": "जमा राशि", "label_en": "Deposit Amount", "type": "number"}
            ])
        },
        {
            "id": "mgnrega",
            "name_hi": "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी योजना",
            "name_en": "MGNREGA",
            "benefit_amount": "₹230-₹375/दिन",
            "benefit_period": "दिन",
            "eligibility": json.dumps([
                {"field": "occupation", "operator": "in", "value": ["farmer", "worker"]},
                {"field": "age", "operator": "gte", "value": 18}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "renewal_missed", "desc_hi": "जॉब कार्ड नवीनीकरण बाकी", "desc_en": "Job card renewal due"},
                {"type": "ekyc_missed", "desc_hi": "eKYC नहीं कराया", "desc_en": "eKYC not done"}
            ]),
            "documents": json.dumps([
                "आधार कार्ड (Aadhaar Card)",
                "जॉब कार्ड (Job Card)",
                "बैंक खाता (Bank Account)",
                "निवास प्रमाण (Residence Proof)"
            ]),
            "apply_url": "https://nrega.nic.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "job_card_no", "label_hi": "जॉब कार्ड नंबर", "label_en": "Job Card Number", "type": "text"},
                {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
                {"name": "ifsc", "label_hi": "IFSC कोड", "label_en": "IFSC Code", "type": "text"}
            ])
        },
        {
            "id": "up-kanya-sumangala",
            "name_hi": "उत्तर प्रदेश कन्या सुमंगला योजना",
            "name_en": "UP Kanya Sumangala Yojana",
            "benefit_amount": "₹15,000 (जन्म से शिक्षा तक)",
            "benefit_period": "एकमुश्त",
            "eligibility": json.dumps([
                {"field": "state", "operator": "eq", "value": "Uttar Pradesh"},
                {"field": "has_daughter", "operator": "eq", "value": True},
                {"field": "annual_income", "operator": "lte", "value": "150000"}
            ]),
            "renewal_period_days": 365,
            "lapse_triggers": json.dumps([
                {"type": "renewal_missed", "desc_hi": "आवेदन नहीं किया", "desc_en": "Application not done"}
            ]),
            "documents": json.dumps([
                "बेटी का जन्म प्रमाण पत्र (Birth Certificate)",
                "आधार कार्ड (Aadhaar Card)",
                "आय प्रमाण पत्र (Income Certificate)",
                "निवास प्रमाण पत्र (Residence Proof)",
                "बैंक खाता (Bank Account)"
            ]),
            "apply_url": "https://kanyasumangala.up.gov.in",
            "form_fields": json.dumps([
                {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"},
                {"name": "girl_birth_cert", "label_hi": "जन्म प्रमाण पत्र संख्या", "label_en": "Birth Certificate Number", "type": "text"},
                {"name": "bank_account", "label_hi": "बैंक खाता संख्या", "label_en": "Bank Account Number", "type": "text"},
                {"name": "ifsc", "label_hi": "IFSC कोड", "label_en": "IFSC Code", "type": "text"},
                {"name": "education_stage", "label_hi": "शिक्षा चरण", "label_en": "Education Stage", "type": "select", "options": ["जन्म (Birth)", "कक्षा 1 (Class 1)", "कक्षा 6 (Class 6)", "कक्षा 9 (Class 9)", "कक्षा 12 (Class 12)"]}
            ])
        }
    ]

    for s in schemes:
        conn.execute("""INSERT OR REPLACE INTO schemes
            (id, name_hi, name_en, benefit_amount, benefit_period, eligibility, renewal_period_days, lapse_triggers, documents, apply_url, form_fields, category, sources)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (s["id"], s["name_hi"], s["name_en"], s["benefit_amount"], s["benefit_period"],
             s["eligibility"], s["renewal_period_days"], s["lapse_triggers"],
             s["documents"], s["apply_url"], s["form_fields"], s.get("category", ""), s.get("sources", "{}")))
    conn.commit()
    conn.close()


def seed_demo_profile():
    conn = get_connection()
    existing = conn.execute("SELECT id FROM profiles LIMIT 1").fetchone()
    if existing:
        pid = existing["id"]
        existing_enrolls = conn.execute("SELECT COUNT(*) FROM enrollments WHERE profile_id=?", (pid,)).fetchone()[0]
        if existing_enrolls > 0:
            conn.close()
            return pid
        _insert_demo_enrollments(conn, pid)
        conn.close()
        return pid

    cursor = conn.execute("""INSERT INTO profiles
        (name, age, gender, state, district, occupation, land_owner, land_acres, annual_income, bank_account_changed, aadhaar, phone, date_of_birth)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        ("Mohan", 62, "male", "Uttar Pradesh", "Lucknow", "farmer", 1, 2.0, "100000", 1,
         "1234-5678-9012", "9876543210", "1964-03-15"))
    profile_id = cursor.lastrowid
    _insert_demo_enrollments(conn, profile_id)
    conn.commit()
    conn.close()
    return profile_id


def _insert_demo_enrollments(conn, profile_id):
    enrollments = [
        ("pm-kisan", "2024-11-01"),
        ("pm-fasal-bima", "2025-01-15"),
        ("ayushman-bharat", "2025-08-01")
    ]
    for scheme_id, last_pay in enrollments:
        conn.execute("INSERT OR IGNORE INTO enrollments (profile_id, scheme_id, last_payment_date) VALUES (?, ?, ?)",
                     (profile_id, scheme_id, last_pay))
    conn.commit()
