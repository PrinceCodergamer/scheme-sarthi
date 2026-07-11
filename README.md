# Scheme Sarthi — योजना सारथी

> **Citizen-first welfare assistant** that proactively detects likely lapsed, at-risk, and unclaimed government scheme benefits using self-declared information and transparent rule evaluation — without requiring Aadhaar access or government database integration.

🏆 **Hackathon MVP** — Built for judging criteria: innovation, technical depth, usability, feasibility, scalability, and presentation.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Smart Scan** | 10-question Hindi profiler → deterministic rule engine evaluates 12+ schemes |
| 🔴 **Lapse Detection** | Missed eKYC, expired renewals, bank-account mismatches, payment gaps |
| 🟡 **At-Risk Alerts** | Deadline proximity warnings (30-day window) |
| 🟢 **Eligibility Discovery** | Finds schemes user qualifies for but hasn't applied |
| 📋 **Revival Assistant** | Plain-Hindi explanation, step checklist, pre-filled form + PDF |
| 📊 **Status Tracker** | 5-stage pipeline (Submitted → Verified → Block → Sanctioned → Restored) |
| 🔔 **Proactive Guardian** | Web push notification demo with "simulate reminder" button |
| 🌐 **Bilingual UI** | Hindi default, instant English toggle |
| 📱 **PWA** | Installable on home screen, offline-capable service worker |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Welcome  │  │ Profiler │  │ Scanning │  │  Results   │ │
│  │  Page    │→│  (10 Q)  │→│ (Engine  │→│ Dashboard  │ │
│  │          │  │          │  │  Viz)    │  │            │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────┬──────┘ │
│                                                   │        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │        │
│  │ Revival  │  │ Status   │  │ Remind-  │        │        │
│  │ Assistant│←│ Tracker  │←│ ers      │        │        │
│  └──────────┘  └──────────┘  └──────────┘        │        │
│                                                   │        │
│  ┌────────────────────────────────────────────────┘        │
│  │  Components: SchemeCard, StatusChip, ProgressStepper    │
│  │  i18n: Hindi/English via context                        │
│  │  Store: React Context + fetch API                       │
│  └─────────────────────────────────────────────────────────┘
                    │  HTTP (proxy /api)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Python FastAPI)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │
│  │  REST    │  │  Rules   │  │  Database (SQLite)        │   │
│  │  API     │→│  Engine  │→│  ├─ schemes (12 seeded)   │   │
│  │          │  │          │  │  ├─ profiles             │   │
│  └──────────┘  │ Pure-Py  │  │  ├─ enrollments          │   │
│                │ determin-│  │  ├─ applications         │   │
│  Offline       │ istic    │  │  └─ reminders            │   │
│  script:       │ matching │  └──────────────────────────┘   │
│  parse_scheme_ │ NO LLM   │                                  │
│  pdf.py ──────→│ guessing │                                  │
│  (Gemini only  └──────────┘                                  │
│   for PDF                                                    │
│   parsing)                                                   │
└─────────────────────────────────────────────────────────────┘
```

### Rule Engine Flow

```
User Profile → Eligibility Rules → Scheme Classification
                                    ├── Enrolled? → Check Lapse Triggers
                                    │               ├── Yes → LAPSED
                                    │               ├── No? → Check At-Risk
                                    │               │        ├── Yes → AT RISK
                                    │               │        └── No → Active (not shown)
                                    └── Not Enrolled? → Check Eligibility
                                                        ├── Match → ELIGIBLE UNCLAIMED
                                                        └── No Match → NOT ELIGIBLE
```

---

## 🚀 Setup (5 commands)

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Quick Start

```bash
# 1. Backend dependencies
cd backend
pip install -r requirements.txt

# 2. Seed database
python -c "from database import init_db, seed_schemes; init_db(); seed_schemes()"

# 3. Frontend dependencies
cd ../frontend
npm install

# 4. Start backend (Terminal 1)
cd ../backend
uvicorn main:app --reload --port 8000

# 5. Start frontend (Terminal 2)
cd ../frontend
npm run dev
```

Open **http://localhost:5173** — Click **"Load demo profile (Mohan)"** for a full end-to-end demo.

---

## 🎯 Demo Flow

1. **Welcome Screen** → Click "Load demo profile (Mohan)"
2. **Scanning Animation** → Watch rule engine pipeline visualization (2.5s)
3. **Results Dashboard** → See Impact Summary + sorted scheme cards
   - 🔴 PM-KISAN: **Lapsed** (eKYC missed, payment gap, bank changed)
   - 🔴 PM Fasal Bima: **Lapsed** (renewal missed, premium not paid)
   - 🟡 Ayushman Bharat: **At Risk** (22 days until renewal)
   - 🟢 Vridha Pension: **Eligible — Apply Now**
4. **Fix a Scheme** → Tap "Fix this" → See explanation, timeline, consequence, form
5. **Submit Application** → Fill form → Tap "Submit"
6. **Track Status** → Go to Applications tab → Advance through 5 stages
7. **Celebration** → Stage 5 triggers confetti + recovery summary
8. **Reminders** → Tap bell tab → See upcoming deadlines → Try "Simulate reminder"

---

## 🔧 Adding New Schemes

### Method 1: Manual (recommended for hackathon scaling)

Add a new entry in `backend/database.py` function `seed_schemes()` following the existing pattern. Each scheme needs:

```python
{
    "id": "unique-kebab-id",
    "name_hi": "हिंदी नाम",
    "name_en": "English Name",
    "benefit_amount": "₹X,XXX/वर्ष",
    "benefit_period": "वर्ष",
    "eligibility": json.dumps([
        {"field": "age", "operator": "gte", "value": 18},
        {"field": "annual_income", "operator": "lte", "value": "150000"}
    ]),
    "renewal_period_days": 365,
    "lapse_triggers": json.dumps([
        {"type": "ekyc_missed", "desc_hi": "eKYC नहीं कराया", "desc_en": "eKYC not completed"},
        {"type": "payment_gap", "desc_hi": "भुगतान नहीं मिला", "desc_en": "Payment missed", "days": 180}
    ]),
    "documents": json.dumps(["आधार कार्ड (Aadhaar Card)"]),
    "apply_url": "https://portal.gov.in",
    "form_fields": json.dumps([
        {"name": "aadhaar", "label_hi": "आधार संख्या", "label_en": "Aadhaar Number", "type": "text"}
    ])
}
```

Then re-seed: delete `scheme_sarthi.db` and re-run seed.

### Method 2: PDF Parsing Script (scales to 3,000 schemes)

```bash
cd backend
pip install google-generativeai PyPDF2
python scripts/parse_scheme_pdf.py --pdf scheme-guidelines.pdf --api-key YOUR_KEY --output rule.json
```

This uses Gemini to extract structured data from official PDFs into the rule schema. The eligibility matching itself remains deterministic — Gemini is used **only** for initial PDF → JSON extraction.

Run multiple PDFs to build your scheme database:
```bash
for pdf in pdfs/*.pdf; do
    python scripts/parse_scheme_pdf.py --pdf "$pdf" --api-key $KEY --output "rules/$(basename $pdf .pdf).json"
done
```

Then import into SQLite with a simple script.

---

## 🧠 Rule Engine Details

### Eligibility Operators
| Operator | Meaning | Example |
|----------|---------|---------|
| `eq` | Equals | `gender eq "male"` |
| `gte` | Greater than or equal | `age gte 60` |
| `lte` | Less than or equal | `annual_income lte "200000"` |
| `in` | Value in list | `occupation in ["farmer", "worker"]` |
| `nin` | Value not in list | `occupation nin ["student"]` |
| `any` | Always matches | `bank_account_changed any` |

### Lapse Triggers
| Type | Condition |
|------|-----------|
| `ekyc_missed` | Fires when days since last payment > renewal period |
| `payment_gap` | Fires when days since last payment > configured days |
| `renewal_missed` | Fires when days since last payment > renewal period |
| `bank_account_changed` | Fires when profile has bank_account_changed = true |

### Priority Scoring
Each scheme gets a priority (Critical/High/Medium/Low) based on:
- Benefit amount (₹0-1,000: 5pts, ₹1,000-10,000: 10pts, ₹10,000-50,000: 20pts, ₹50,000+: 30pts, ₹1,00,000+: 40pts)
- Status (Lapsed: 30pts, At Risk: 20pts, Eligible: 15pts)
- Number of detected issues (5pts each, max 15)
- Deadline proximity (Overdue: 15pts, >90%: 10pts, >70%: 5pts)

### Confidence Levels
- **High**: 3+ lapse triggers OR all eligibility rules match
- **Medium**: 1-2 triggers matched OR partial eligibility
- **Low**: Only 1 trigger or weak match

---

## 📁 Project Structure

```
scheme-sarthi/
├── backend/
│   ├── main.py                 # FastAPI server (all endpoints)
│   ├── database.py             # SQLite init, seed data (12 schemes)
│   ├── rules_engine.py         # Deterministic matching engine
│   ├── requirements.txt
│   ├── test_scan.py            # CLI test for engine
│   └── scripts/
│       └── parse_scheme_pdf.py # Gemini PDF → JSON rule parser
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js               # Service Worker (offline + push)
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # Page router + layout
│       ├── index.css           # Design system + animations
│       ├── store/
│       │   └── appStore.jsx    # Global state + API calls
│       ├── components/
│       │   ├── BottomNav.jsx
│       │   ├── LanguageToggle.jsx
│       │   ├── ProgressStepper.jsx
│       │   ├── SchemeCard.jsx
│       │   └── StatusChip.jsx
│       ├── pages/
│       │   ├── WelcomePage.jsx
│       │   ├── ProfilerPage.jsx
│       │   ├── ScanningPage.jsx
│       │   ├── ResultsPage.jsx
│       │   ├── RevivalPage.jsx
│       │   ├── ApplicationsPage.jsx
│       │   └── RemindersPage.jsx
│       └── i18n/
│           ├── hi.json
│           └── en.json
├── start.ps1                   # One-command startup (Windows)
└── README.md
```

---

## 💡 Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Deterministic rules** | Zero LLM hallucination risk; auditable; explainable |
| **SQLite** | Zero-config, portable, sufficient for 3,000+ schemes |
| **FastAPI** | Type-safe, auto-docs, async-ready, Python ecosystem |
| **React + Vite** | Fast dev, PWA support, excellent DX |
| **Hindi-first** | Target users are Hindi-speaking rural citizens |
| **Mobile-first 480px** | Phone-like demo on projector, real mobile usage |
| **No Aadhaar API** | DPDP compliant, no auth complexity, trust signal |
| **Self-declared data**| No government database access needed, legal compliance |

---

## 📊 Seed Schemes (12)

| # | Scheme | Category |
|---|--------|----------|
| 1 | PM-KISAN Samman Nidhi | Farmer |
| 2 | PM Fasal Bima Yojana | Farmer |
| 3 | Ayushman Bharat PM-JAY | Health |
| 4 | Vridha Pension Yojana (UP) | Senior |
| 5 | National Scholarship Portal | Student |
| 6 | PM Ujjwala Yojana | Women |
| 7 | PM Awas Yojana - Gramin | Housing |
| 8 | Atal Pension Yojana | Pension |
| 9 | PM Shram Yogi Maandhan | Worker |
| 10 | Sukanya Samriddhi Yojana | Girl Child |
| 11 | MGNREGA | Rural Employment |
| 12 | UP Kanya Sumangala Yojana | Girl Child |

---

## 📐 Non-Goals

- Real portal submission (simulated for demo)
- Aadhaar number lookup / verification
- Authentication beyond local profile
- Payment processing
- Dark mode (elderly accessibility)

---

## 📄 License

MIT — Built for hackathon demonstration. Not affiliated with any government agency.
