from database import get_connection, seed_demo_profile
from rules_engine import scan_profile, calculate_total_benefit
import json

pid = seed_demo_profile()
print(f'Demo profile ID: {pid}')

conn = get_connection()
profile = dict(conn.execute('SELECT * FROM profiles WHERE id=?', (pid,)).fetchone())
profile['land_owner'] = bool(profile['land_owner'])
profile['bank_account_changed'] = bool(profile['bank_account_changed'])
print('Profile:', profile['name'], profile['age'], profile['state'])

schemes = []
for r in conn.execute('SELECT * FROM schemes').fetchall():
    s = dict(r)
    s['eligibility'] = json.loads(s['eligibility'])
    s['lapse_triggers'] = json.loads(s['lapse_triggers'])
    s['documents'] = json.loads(s['documents'])
    s['form_fields'] = json.loads(s['form_fields'])
    schemes.append(s)

enrollments = [dict(e) for e in conn.execute('SELECT * FROM enrollments WHERE profile_id=?', (pid,)).fetchall()]
print('Enrollments:', [(e['scheme_id'], e['last_payment_date']) for e in enrollments])

results = scan_profile(profile, schemes, enrollments)
print()
print('=== LAPSED ===')
for l in results['lapsed']:
    print(f"  {l['name_en']}: {l['reason_en']}")
print('=== AT RISK ===')
for a in results['at_risk']:
    print(f"  {a['name_en']}: {a['reason_en']}")
print('=== ELIGIBLE UNCLAIMED ===')
for e in results['eligible_unclaimed']:
    print(f"  {e['name_en']}: {e['reason_en']}")
print('=== NOT ELIGIBLE ===')
for n in results['not_eligible']:
    print(f"  {n['name_en']}: {n['reason_en']}")
print()
print('Total benefit:', calculate_total_benefit(results))
