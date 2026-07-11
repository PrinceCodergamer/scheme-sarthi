import os
from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "gemini-2.0-flash"

client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

CONVERSATION_HISTORY: Dict[int, List[Dict]] = {}

SYSTEM_PROMPT = """You are Scheme Sarthi AI – India's first AI Welfare Copilot.

Your role is to help Indian citizens understand, track, and never lose their government welfare benefits.

## Core Rules
1. You are NOT the decision maker. The Rule Engine is the source of truth.
2. Never invent or override government rules.
3. Always explain the rule engine's decisions in plain language.
4. Be proactive, not reactive – suggest next actions.

## How to respond
- Use simple Hinglish (mix of Hindi and English) or pure Hindi/English based on user preference
- Be warm, respectful, and helpful
- Explain government terminology in simple words
- Always include WHY, what it means, and what to do next
- Keep responses concise (under 150 words unless explaining complex topics)

## Context
The user is using Scheme Sarthi which tracks their government scheme benefits.
The system detects: lapsed schemes, at-risk schemes, eligible-unclaimed schemes.
The user's profile contains: name, age, gender, state, district, occupation, land info, income, family info.

## What you can do
1. Explain scheme rules in simple language
2. Explain why a scheme lapsed or is at risk
3. Suggest next actions
4. Help with life events (marriage, birth, job loss, etc.)
5. Translate government terminology
6. Recommend documents needed
7. Explain where to apply
8. Calculate estimated benefits
9. Create personalized action plans
10. Answer questions about welfare schemes

## Response format (JSON)
Always respond in this JSON format:
{
  "message": "Your main response text",
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"],
  "actions": [
    {"label": "Action button text", "action": "action_type", "params": {}}
  ],
  "confidence": "high|medium|low"
}
"""


def is_available() -> bool:
    return client is not None and GEMINI_API_KEY != ""


def chat(profile_id: int, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
    if not is_available():
        return {
            "message": "AI assistant is currently unavailable. Our rule engine is still working perfectly.",
            "suggestions": ["Check my schemes", "What are my benefits?", "Show my action plan"],
            "actions": [],
            "confidence": "low",
        }

    if profile_id not in CONVERSATION_HISTORY:
        CONVERSATION_HISTORY[profile_id] = []

    profile_context = _build_profile_context(context)
    scheme_context = _build_scheme_context(context)
    convo_history = CONVERSATION_HISTORY[profile_id][-10:]  # Last 10 messages

    full_prompt = f"""{SYSTEM_PROMPT}

## Current User Profile
{profile_context}

## Current Scheme Status
{scheme_context}

## Conversation History
{_format_history(convo_history)}

## Latest User Message
{message}

## Respond in the specified JSON format only.
"""

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )
        result = _parse_response(response.text)
        CONVERSATION_HISTORY[profile_id].append({"role": "user", "content": message})
        CONVERSATION_HISTORY[profile_id].append({"role": "assistant", "content": result.get("message", "")})
        return result
    except Exception as e:
        return {
            "message": "I'm having trouble connecting. Please try again.",
            "suggestions": ["Check my schemes", "What are my benefits?", "Help with documents"],
            "actions": [],
            "confidence": "low",
        }


def process_life_event(profile_id: int, event: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Process life events like marriage, birth, job loss, etc."""
    if not is_available():
        return {"message": "Life event processing unavailable right now.", "profile_updates": {}, "new_eligibility": []}

    profile_context = _build_profile_context(context)

    prompt = f"""{SYSTEM_PROMPT}

## Current User Profile
{profile_context}

## Life Event Reported
The user reported: "{event}"

## Your Task
1. Understand what changed in the user's life
2. Determine what profile fields need updating
3. Suggest which new schemes they might be eligible for
4. Explain what documents they might need
5. Suggest next actions

## Respond ONLY in this JSON format:
{{
  "message": "Understanding message with empathy + what changed + what to do next",
  "profile_updates": {{"field_name": "new_value"}},
  "newly_eligible_suggestions": ["scheme_name_1", "scheme_name_2"],
  "lost_eligibility": ["scheme_name"],
  "documents_needed": ["document_1", "document_2"],
  "suggestions": ["question_1", "question_2", "question_3"],
  "actions": [{{"label": "Button", "action": "action_type", "params": {{}}}}]
}}
"""

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.5, max_output_tokens=1024),
        )
        return _parse_response(response.text)
    except Exception:
        return {"message": "Could not process life event right now.", "profile_updates": {}, "newly_eligible_suggestions": []}


def generate_action_plan(profile_id: int, scan_results: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a prioritized action plan from scan results."""
    if not is_available():
        return {"actions": [], "total_recoverable": 0, "estimated_time": 0}

    results_str = json.dumps(scan_results, indent=2, default=str)

    prompt = f"""You are Scheme Sarthi AI. Create a personalized action plan from these scan results.

SCAN RESULTS:
{results_str}

Create a prioritized action plan. Sort by urgency (lapsed first, then at-risk, then eligible-unclaimed).

Respond ONLY in this JSON format:
{{
  "actions": [
    {{
      "priority": 1,
      "title": "Complete eKYC for PM-KISAN",
      "scheme_id": "pm-kisan",
      "category": "lapsed",
      "time_minutes": 5,
      "benefit_impact": "₹6000/year",
      "steps": ["Open PM-KISAN website", "Login with Aadhaar", "Complete eKYC", "Confirm update"]
    }}
  ],
  "total_recoverable": "₹XX,XXX/year",
  "estimated_time_minutes": 30,
  "summary": "Brief summary of the plan"
}}
"""

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.3, max_output_tokens=2048),
        )
        return _parse_response(response.text)
    except Exception:
        return {"actions": [], "total_recoverable": "₹0", "estimated_time_minutes": 0, "summary": ""}


def _build_profile_context(context: Dict) -> str:
    safe_fields = ["name", "age", "gender", "state", "district", "occupation",
                   "land_owner", "land_acres", "annual_income", "has_daughter"]
    return "\n".join(f"- {k}: {v}" for k, v in context.items() if k in safe_fields and v)


def _build_scheme_context(context: Dict) -> str:
    parts = []
    if "scan_results" in context:
        results = context["scan_results"]
        for category in ["lapsed", "at_risk", "eligible_unclaimed"]:
            items = results.get(category, [])
            if items:
                parts.append(f"\n{category.upper()}:")
                for item in items[:5]:
                    parts.append(f"  - {item.get('name_en', 'Unknown')} ({item.get('benefit_amount', 'N/A')})")
    if "current_page" in context:
        parts.append(f"\nCurrent page: {context['current_page']}")
    if "current_scheme" in context:
        parts.append(f"Viewing scheme: {context['current_scheme']}")
    return "\n".join(parts)


def _format_history(history: List) -> str:
    return "\n".join(f"{'User' if h['role']=='user' else 'Assistant'}: {h['content']}" for h in history[-6:])


def _parse_response(text: str) -> Dict:
    import re, json
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    return {"message": text[:500], "suggestions": [], "actions": [], "confidence": "medium"}


# Fallback: import json at module level
import json
