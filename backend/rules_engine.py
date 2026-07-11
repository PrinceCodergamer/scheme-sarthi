import json
from datetime import datetime, timedelta

def evaluate_rule(field_value, operator, target_value):
    if operator == "eq":
        return field_value == target_value
    elif operator == "gte":
        return field_value >= target_value
    elif operator == "lte":
        return field_value <= target_value
    elif operator == "in":
        return field_value in target_value if isinstance(target_value, list) else field_value == target_value
    elif operator == "nin":
        return field_value not in target_value if isinstance(target_value, list) else field_value != target_value
    elif operator == "any":
        return True
    return False


def check_eligibility(profile, scheme):
    rules = scheme["eligibility"]
    if isinstance(rules, str):
        rules = json.loads(rules)
    matched_rules = []
    failed_rules = []
    confidence_score = 1.0

    for rule in rules:
        field = rule["field"]
        value = profile.get(field)
        field_match = value is not None and evaluate_rule(value, rule["operator"], rule["value"])
        rule_info = {
            "field": field,
            "operator": rule["operator"],
            "expected": rule["value"],
            "actual": value,
            "matched": field_match
        }
        if field_match:
            matched_rules.append(rule_info)
        else:
            failed_rules.append(rule_info)
            # Reduce confidence for each failed rule
            confidence_score *= 0.85

    # Higher confidence when more rules match
    total_rules = len(rules)
    matched_count = len(matched_rules)
    if total_rules > 0:
        confidence_score = round(matched_count / total_rules, 1)
    else:
        confidence_score = 1.0

    is_eligible = len(failed_rules) == 0
    return is_eligible, matched_rules, failed_rules, confidence_score


def _days_since_last_payment(scheme_enrollments):
    for enrol in scheme_enrollments:
        if enrol.get("last_payment_date"):
            try:
                last_pay = datetime.strptime(enrol["last_payment_date"], "%Y-%m-%d")
                return (datetime.now() - last_pay).days, last_pay
            except:
                pass
    return None, None


def _parse_benefit_amount(amt_str):
    try:
        parts = amt_str.replace("₹", "").replace(",", "").split("/")
        return float(parts[0].replace(",", ""))
    except:
        return 0


def _extract_benefit_value(amt_str):
    try:
        raw = amt_str.replace("₹", "").replace(",", "").split("/")[0].split("-")
        return float(raw[0]) if raw else 0
    except:
        return 0


def check_lapse(profile, scheme, enrollments):
    triggers = scheme["lapse_triggers"]
    if isinstance(triggers, str):
        triggers = json.loads(triggers)
    scheme_enrollments = [e for e in enrollments if e["scheme_id"] == scheme["id"]]
    days_since, last_pay = _days_since_last_payment(scheme_enrollments)

    lapse_reasons_hi = []
    lapse_reasons_en = []
    triggered_fields = []
    renewal_days = scheme.get("renewal_period_days", 365)

    for trigger in triggers:
        ttype = trigger["type"]

        if ttype == "bank_account_changed":
            if profile.get("bank_account_changed"):
                lapse_reasons_hi.append(trigger["desc_hi"])
                lapse_reasons_en.append(trigger["desc_en"])
                triggered_fields.append("bank_account_changed")

        if ttype == "payment_gap":
            days_limit = trigger.get("days", 365)
            if days_since is not None and days_since > days_limit:
                lapse_reasons_hi.append(f"{trigger['desc_hi']} ({days_since} दिन से)")
                lapse_reasons_en.append(f"{trigger['desc_en']} ({days_since} days)")
                triggered_fields.append("last_payment_date")

        if ttype == "ekyc_missed":
            if days_since is not None and days_since > renewal_days:
                lapse_reasons_hi.append(trigger["desc_hi"])
                lapse_reasons_en.append(trigger["desc_en"])
                triggered_fields.append("last_payment_date")

        if ttype == "renewal_missed":
            if days_since is not None and days_since > renewal_days:
                lapse_reasons_hi.append(trigger["desc_hi"])
                lapse_reasons_en.append(trigger["desc_en"])
                triggered_fields.append("last_payment_date")

    confidence = "High"
    if len(lapse_reasons_hi) >= 3:
        confidence = "High"
    elif len(lapse_reasons_hi) >= 1:
        confidence = "Medium"
    else:
        confidence = "Low"

    return lapse_reasons_hi, lapse_reasons_en, triggered_fields, confidence


def check_at_risk(profile, scheme, enrollments):
    triggers = scheme["lapse_triggers"]
    if isinstance(triggers, str):
        triggers = json.loads(triggers)
    scheme_enrollments = [e for e in enrollments if e["scheme_id"] == scheme["id"]]
    days_since, last_pay = _days_since_last_payment(scheme_enrollments)
    reasons_hi = []
    reasons_en = []
    triggered_fields = []

    renewal_days = scheme.get("renewal_period_days", 365)
    at_risk_window = 30

    if days_since is not None:
        if days_since >= (renewal_days - at_risk_window) and days_since < renewal_days:
            days_left = renewal_days - days_since
            reasons_hi.append(f"नवीनीकरण में {days_left} दिन शेष")
            reasons_en.append(f"{days_left} days until renewal deadline")
            triggered_fields.append("last_payment_date")

        if days_since >= (renewal_days * 0.7) and days_since < renewal_days:
            reasons_hi.append("eKYC अपडेट आवश्यक (30 दिन में)")
            reasons_en.append("eKYC update needed (within 30 days)")
            triggered_fields.append("last_payment_date")

    confidence = "Medium" if reasons_hi else "Low"
    return reasons_hi, reasons_en, triggered_fields, confidence


def compute_priority(status, scheme, days_since, reasons_count):
    benefit_val = _extract_benefit_value(scheme["benefit_amount"])
    score = 0

    # Benefit amount score (0-40)
    if benefit_val >= 100000:
        score += 40
    elif benefit_val >= 50000:
        score += 30
    elif benefit_val >= 10000:
        score += 20
    elif benefit_val >= 1000:
        score += 10
    else:
        score += 5

    # Status score (0-30)
    if status == "lapsed":
        score += 30
    elif status == "at_risk":
        score += 20
    elif status == "eligible_unclaimed":
        score += 15

    # Reason count (0-15)
    score += min(reasons_count * 5, 15)

    # Deadline proximity (0-15)
    if days_since is not None:
        renewal = scheme.get("renewal_period_days", 365)
        if days_since > renewal:
            score += 15  # overdue
        elif days_since > renewal * 0.9:
            score += 10
        elif days_since > renewal * 0.7:
            score += 5

    if score >= 70:
        return "Critical"
    elif score >= 50:
        return "High"
    elif score >= 30:
        return "Medium"
    return "Low"


def generate_timeline(scheme_enrollments, scheme):
    timeline = []
    renewal_days = scheme.get("renewal_period_days", 365)

    for enrol in scheme_enrollments:
        if enrol.get("last_payment_date"):
            try:
                dt = datetime.strptime(enrol["last_payment_date"], "%Y-%m-%d")
                label_hi = dt.strftime("%b %Y")
                label_en = dt.strftime("%b %Y")
                days_since = (datetime.now() - dt).days
                if days_since > renewal_days:
                    status = "missed"
                elif days_since > renewal_days * 0.8:
                    status = "warning"
                else:
                    status = "paid"
                timeline.append({
                    "date": enrol["last_payment_date"],
                    "label_hi": label_hi,
                    "label_en": label_en,
                    "status": status
                })
            except:
                pass

    # Add expected upcoming payment
    if timeline:
        last_dt = datetime.strptime(timeline[-1]["date"], "%Y-%m-%d")
        next_dt = last_dt + timedelta(days=renewal_days)
        if next_dt > datetime.now():
            timeline.append({
                "date": next_dt.strftime("%Y-%m-%d"),
                "label_hi": next_dt.strftime("%b %Y") + " (अपेक्षित)",
                "label_en": next_dt.strftime("%b %Y") + " (expected)",
                "status": "upcoming"
            })
        else:
            timeline.append({
                "date": next_dt.strftime("%Y-%m-%d"),
                "label_hi": next_dt.strftime("%b %Y") + " (छूटा)",
                "label_en": next_dt.strftime("%b %Y") + " (missed)",
                "status": "missed"
            })

    return timeline


def get_consequences(status, scheme, reasons_count):
    benefit_val = _extract_benefit_value(scheme["benefit_amount"])
    hi_parts = []
    en_parts = []

    hi_parts.append(f"₹{int(benefit_val):,}/वर्ष का लाभ खो सकते हैं")
    en_parts.append(f"Lose ₹{int(benefit_val):,}/year")

    if status == "lapsed":
        hi_parts.append("नए सिरे से आवेदन करना होगा")
        en_parts.append("May require fresh verification")
    elif status == "at_risk":
        hi_parts.append("समय पर कार्रवाई नहीं की गई तो लाभ रुक सकता है")
        en_parts.append("Benefits may stop if not renewed on time")

    if reasons_count >= 2:
        hi_parts.append("एक से अधिक समस्याएँ पाई गईं")
        en_parts.append("Multiple issues detected")

    return "; ".join(hi_parts), "; ".join(en_parts)


def get_recovery_estimate(status, scheme, reasons_count):
    difficulty = "Easy"
    minutes = 10
    office_visit = False

    benefit_val = _extract_benefit_value(scheme["benefit_amount"])
    if status == "lapsed" and reasons_count >= 3:
        difficulty = "Hard"
        minutes = 45
        office_visit = True
    elif status == "lapsed":
        difficulty = "Medium"
        minutes = 25
        office_visit = True
    elif status == "at_risk":
        difficulty = "Easy"
        minutes = 15
        office_visit = False
    elif status == "eligible_unclaimed":
        difficulty = "Easy"
        minutes = 10
        office_visit = False

    return {
        "difficulty_hi": difficulty,
        "difficulty_en": difficulty,
        "estimated_minutes": minutes,
        "office_visit_required": office_visit,
        "documents_required": len(json.loads(scheme["documents"])) if isinstance(scheme["documents"], str) else len(scheme["documents"])
    }


def scan_profile(profile, schemes, enrollments):
    results = {
        "lapsed": [],
        "at_risk": [],
        "eligible_unclaimed": [],
        "not_eligible": []
    }

    enrolled_scheme_ids = {e["scheme_id"] for e in enrollments}

    # First pass: classify every scheme
    for scheme in schemes:
        eligible, matched_rules, failed_rules, confidence_score = check_eligibility(profile, scheme)
        is_enrolled = scheme["id"] in enrolled_scheme_ids

        scheme_enrollments = [e for e in enrollments if e["scheme_id"] == scheme["id"]]
        days_since, last_pay = _days_since_last_payment(scheme_enrollments)

        base = {
            "scheme_id": scheme["id"],
            "name_hi": scheme["name_hi"],
            "name_en": scheme["name_en"],
            "benefit_amount": scheme["benefit_amount"],
            "benefit_period": scheme.get("benefit_period", "year"),
            "apply_url": scheme.get("apply_url", ""),
            "documents": json.loads(scheme["documents"]) if isinstance(scheme["documents"], str) else scheme["documents"],
            "matched_rules": matched_rules,
            "failed_rules": failed_rules,
            "confidence_score": confidence_score,
            "timeline": generate_timeline(scheme_enrollments, scheme) if is_enrolled else [],
        }

        if is_enrolled:
            lapse_hi, lapse_en, lapse_fields, lapse_conf = check_lapse(profile, scheme, enrollments)
            at_risk_hi, at_risk_en, at_risk_fields, at_risk_conf = check_at_risk(profile, scheme, enrollments)

            if lapse_hi:
                cons_hi, cons_en = get_consequences("lapsed", scheme, len(lapse_hi))
                recovery = get_recovery_estimate("lapsed", scheme, len(lapse_hi))
                priority = compute_priority("lapsed", scheme, days_since, len(lapse_hi))
                base["priority"] = priority
                base["consequence_hi"] = cons_hi
                base["consequence_en"] = cons_en
                base["recovery"] = recovery
                base["confidence"] = lapse_conf
                base["triggered_fields"] = lapse_fields
                base["reasons_hi"] = lapse_hi
                base["reasons_en"] = lapse_en
                base["reason_hi"] = ", ".join(lapse_hi)
                base["reason_en"] = ", ".join(lapse_en)
                base["status"] = "lapsed"
                results["lapsed"].append(base)
            elif at_risk_hi:
                cons_hi, cons_en = get_consequences("at_risk", scheme, len(at_risk_hi))
                recovery = get_recovery_estimate("at_risk", scheme, len(at_risk_hi))
                priority = compute_priority("at_risk", scheme, days_since, len(at_risk_hi))
                base["priority"] = priority
                base["consequence_hi"] = cons_hi
                base["consequence_en"] = cons_en
                base["recovery"] = recovery
                base["confidence"] = at_risk_conf
                base["triggered_fields"] = at_risk_fields
                base["reasons_hi"] = at_risk_hi
                base["reasons_en"] = at_risk_en
                base["reason_hi"] = ", ".join(at_risk_hi)
                base["reason_en"] = ", ".join(at_risk_en)
                base["status"] = "at_risk"
                results["at_risk"].append(base)
        elif eligible:
            cons_hi, cons_en = get_consequences("eligible_unclaimed", scheme, 0)
            recovery = get_recovery_estimate("eligible_unclaimed", scheme, 0)
            priority = compute_priority("eligible_unclaimed", scheme, days_since, 0)
            base["priority"] = priority
            base["consequence_hi"] = cons_hi
            base["consequence_en"] = cons_en
            base["recovery"] = recovery
            base["confidence"] = "High" if confidence_score >= 0.8 else "Medium"
            base["triggered_fields"] = [r["field"] for r in matched_rules]
            base["reason_hi"] = "आप इस योजना के पात्र हैं, लेकिन अभी तक आवेदन नहीं किया"
            base["reason_en"] = "You are eligible but haven't applied yet"
            base["status"] = "eligible_unclaimed"
            results["eligible_unclaimed"].append(base)
        else:
            base["reason_hi"] = "पात्रता मापदंड पूरे नहीं"
            base["reason_en"] = "Eligibility criteria not met"
            base["status"] = "not_eligible"
            base["priority"] = "Low"
            base["consequence_hi"] = "इस योजना के लिए पात्र नहीं"
            base["consequence_en"] = "Not eligible for this scheme"
            base["recovery"] = get_recovery_estimate("not_eligible", scheme, 0)
            results["not_eligible"].append(base)

    # Sort each category by priority
    priority_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    for category in results:
        results[category].sort(key=lambda x: priority_order.get(x.get("priority", "Low"), 99))

    return results


def calculate_total_benefit(results):
    total = 0
    for category in ["lapsed", "at_risk", "eligible_unclaimed"]:
        for item in results[category]:
            total += _extract_benefit_value(item["benefit_amount"])
    return int(total)


def calculate_estimated_time(results):
    total_minutes = 0
    for category in ["lapsed", "at_risk", "eligible_unclaimed"]:
        for item in results[category]:
            recovery = item.get("recovery", {})
            total_minutes += recovery.get("estimated_minutes", 15)
    return total_minutes
