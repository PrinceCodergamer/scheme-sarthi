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


def send_scheme_alert(to: str, profile_name: str, scheme_name: str, alert_type: str, details: str) -> dict:
    if alert_type == "lapsed":
        msg = f"⚠️ *Scheme Lapse Alert*\n\nHi {profile_name},\n\nYour benefit under *{scheme_name}* may have lapsed.\n\n{details}\n\nOpen Scheme Sarthi to take action."
    elif alert_type == "at_risk":
        msg = f"🔔 *Scheme At Risk*\n\nHi {profile_name},\n\nYour *{scheme_name}* benefit is at risk.\n\n{details}\n\nOpen Scheme Sarthi to renew."
    elif alert_type == "reminder":
        msg = f"📅 *Renewal Reminder*\n\nHi {profile_name},\n\n{scheme_name} renewal is due soon.\n\n{details}"
    else:
        msg = f"Hi {profile_name},\n\n{details}"
    return send_whatsapp(to, msg)


def get_log() -> list:
    return WHATSAPP_LOG
