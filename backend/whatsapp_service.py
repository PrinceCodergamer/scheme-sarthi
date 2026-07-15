import os
import base64
import json
import requests
from datetime import datetime

META_WHATSAPP_TOKEN = os.environ.get("META_WHATSAPP_TOKEN", "")
META_PHONE_NUMBER_ID = os.environ.get("META_PHONE_NUMBER_ID", "")
META_API_VERSION = "v22.0"

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.environ.get("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

WHATSAPP_LOG = []


def _send_meta(to: str, message: str) -> dict:
    url = f"https://graph.facebook.com/{META_API_VERSION}/{META_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {META_WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to.lstrip("whatsapp:+").replace("+", "").strip(),
        "type": "text",
        "text": {"body": message},
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        result = resp.json()
        status = "sent" if resp.ok else "failed"
        WHATSAPP_LOG.append({
            "to": to,
            "message": message,
            "status": status,
            "provider": "meta",
            "meta_error": result.get("error", {}).get("message") if not resp.ok else None,
            "timestamp": datetime.now().isoformat(),
        })
        return {
            "status": status,
            "provider": "meta",
            "meta_message_id": result.get("messages", [{}])[0].get("id") if resp.ok else None,
            "error": result.get("error", {}).get("message") if not resp.ok else None,
        }
    except Exception as e:
        WHATSAPP_LOG.append({
            "to": to,
            "message": message,
            "status": "error",
            "provider": "meta",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        })
        return {"status": "error", "provider": "meta", "error": str(e)}


def _send_twilio(to: str, message: str) -> dict:
    if not to.startswith("whatsapp:"):
        to = f"whatsapp:{to}"
    auth = base64.b64encode(f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode()).decode()
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    try:
        resp = requests.post(
            url,
            data={"To": to, "From": TWILIO_WHATSAPP_NUMBER, "Body": message},
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=15,
        )
        result = resp.json()
        status = "sent" if resp.ok else "failed"
        WHATSAPP_LOG.append({
            "to": to,
            "message": message,
            "status": status,
            "provider": "twilio",
            "twilio_sid": result.get("sid"),
            "twilio_error": result.get("message"),
            "timestamp": datetime.now().isoformat(),
        })
        return {
            "status": status,
            "provider": "twilio",
            "sid": result.get("sid"),
            "error": result.get("message") if not resp.ok else None,
        }
    except Exception as e:
        WHATSAPP_LOG.append({
            "to": to,
            "message": message,
            "status": "error",
            "provider": "twilio",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        })
        return {"status": "error", "provider": "twilio", "error": str(e)}


def send_whatsapp(to: str, message: str) -> dict:
    if META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID:
        return _send_meta(to, message)
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        return _send_twilio(to, message)
    log_entry = {
        "to": to,
        "message": message,
        "status": "simulated",
        "provider": "simulated",
        "timestamp": datetime.now().isoformat(),
    }
    WHATSAPP_LOG.append(log_entry)
    return {"status": "simulated", "provider": "simulated", "message": message, "to": to}


TEMPLATES = {
    "hi": {
        "lapsed": "⚠️ *योजना लैप्स अलर्ट*\n\nनमस्ते {name},\n\n*{scheme}* के तहत आपका लाभ लैप्स हो सकता है।\n\n{details}\n\nकार्रवाई के लिए योजना सारथी खोलें।",
        "at_risk": "🔔 *योजना जोखिम में*\n\nनमस्ते {name},\n\nआपका *{scheme}* लाभ जोखिम में है।\n\n{details}\n\nनवीनीकरण के लिए योजना सारथी खोलें।",
        "reminder": "📅 *नवीनीकरण रिमाइंडर*\n\nनमस्ते {name},\n\n{scheme} का नवीनीकरण जल्द ही देय है।\n\n{details}",
        "generic": "नमस्ते {name},\n\n{details}",
    },
    "ta": {
        "lapsed": "⚠️ *திட்ட காலாவதி எச்சரிக்கை*\n\nவணக்கம் {name},\n\n*{scheme}* இன் கீழ் உங்கள் பலன் காலாவதியாகியிருக்கலாம்.\n\n{details}\n\nநடவடிக்கை எடுக்க திட்ட சாரதியைத் திறக்கவும்.",
        "at_risk": "🔔 *திட்டம் இடரில்*\n\nவணக்கம் {name},\n\nஉங்கள் *{scheme}* பலன் இடரில் உள்ளது.\n\n{details}\n\nபுதுப்பிக்க திட்ட சாரதியைத் திறக்கவும்.",
        "reminder": "📅 *புதுப்பிப்பு நினைவூட்டல்*\n\nவணக்கம் {name},\n\n{scheme} புதுப்பிப்பு விரைவில் காலாவதியாகிறது.\n\n{details}",
        "generic": "வணக்கம் {name},\n\n{details}",
    },
    "bn": {
        "lapsed": "⚠️ *স্কিম মেয়াদোত্তীর্ণ সতর্কতা*\n\nহ্যালো {name},\n\n*{scheme}* এর অধীনে আপনার সুবিধা মেয়াদোত্তীর্ণ হতে পারে।\n\n{details}\n\nপদক্ষেপ নিতে স্কিম সারথি খুলুন।",
        "at_risk": "🔔 *স্কিম ঝুঁকিতে*\n\nহ্যালো {name},\n\nআপনার *{scheme}* সুবিধা ঝুঁকিতে রয়েছে।\n\n{details}\n\nনবায়নের জন্য স্কিম সারথি খুলুন।",
        "reminder": "📅 *নবায়ন রিমাইন্ডার*\n\nহ্যালো {name},\n\n{scheme} নবায়ন শীঘ্রই বকেয়া।\n\n{details}",
        "generic": "হ্যালো {name},\n\n{details}",
    },
    "mr": {
        "lapsed": "⚠️ *योजना लॅप्स सूचना*\n\nनमस्कार {name},\n\n*{scheme}* अंतर्गत तुमचा लाभ लॅप्स झाला असू शकतो.\n\n{details}\n\nकारवाईसाठी योजना सारथी उघडा.",
        "at_risk": "🔔 *योजना जोखमीत*\n\nनमस्कार {name},\n\nतुमचा *{scheme}* लाभ जोखमीत आहे.\n\n{details}\n\nनूतनीकरणासाठी योजना सारथी उघडा.",
        "reminder": "📅 *नूतनीकरण स्मरणपत्र*\n\nनमस्कार {name},\n\n{scheme} चे नूतनीकरण लवकरच बाकी आहे.\n\n{details}",
        "generic": "नमस्कार {name},\n\n{details}",
    },
}

DEFAULT_TEMPLATES = TEMPLATES["hi"]


def send_scheme_alert(to: str, profile_name: str, scheme_name: str, alert_type: str, details: str, lang: str = "hi") -> dict:
    templates = TEMPLATES.get(lang, DEFAULT_TEMPLATES)
    tmpl = templates.get(alert_type, templates["generic"])
    msg = tmpl.format(name=profile_name, scheme=scheme_name, details=details)
    return send_whatsapp(to, msg)


def get_log() -> list:
    return WHATSAPP_LOG
