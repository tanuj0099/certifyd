import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "https://ejgadkswcjorkyzkqhfl.supabase.co")
key = os.environ.get("SUPABASE_KEY")
if not key:
    with open("../.env.local", "r") as f:
        for line in f:
            if "NEXT_PUBLIC_SUPABASE_ANON_KEY" in line or "SUPABASE_KEY" in line:
                key = line.split("=")[1].strip().strip('"').strip("'")
                break

supabase: Client = create_client(url, key)

response = supabase.table("certifications").select("*").execute()
certs = response.data

print(f"Total Certifications in DB: {len(certs)}")

issues = []
for c in certs:
    title = c.get('name')
    cost = c.get('cost_usd')
    duration = c.get('exam_duration_minutes')
    questions = c.get('total_questions')
    
    if cost is None or cost <= 0: issues.append(f"{title}: Invalid Cost ({cost})")
    if duration is None or duration <= 0: issues.append(f"{title}: Invalid Duration ({duration})")
    if questions is None or questions <= 0: issues.append(f"{title}: Invalid Questions ({questions})")

if not issues:
    print("All certifications passed data authenticity checks! No zero or null values for cost, duration, or questions.")
else:
    print("Data Authenticity Issues Found:")
    for issue in issues:
        print(f"  - {issue}")
