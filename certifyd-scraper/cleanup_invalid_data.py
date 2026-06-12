import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL", "https://ejgadkswcjorkyzkqhfl.supabase.co")
key = os.environ.get("SUPABASE_KEY")
if not key:
    with open("../.env.local", "r") as f:
        for line in f:
            if "NEXT_PUBLIC_SUPABASE_ANON_KEY" in line or "SUPABASE_KEY" in line:
                key = line.split("=")[1].strip().strip('"').strip("'")
                break

supabase = create_client(url, key)

response = supabase.table("certifications").select("id, name, cost_usd, exam_duration_minutes, total_questions").execute()
certs = response.data

invalid_ids = []
for c in certs:
    title = c.get('name')
    cost = c.get('cost_usd')
    duration = c.get('exam_duration_minutes')
    questions = c.get('total_questions')
    
    if cost is None or cost <= 0 or duration is None or duration <= 0 or questions is None or questions <= 0:
        invalid_ids.append(c['id'])
        print(f"Flagged for deletion: {title.encode('ascii', 'ignore').decode()} (Cost: {cost}, Dur: {duration}, Q: {questions})")

if invalid_ids:
    print(f"\nDeleting {len(invalid_ids)} invalid/legacy certifications...")
    # Batch delete
    for cid in invalid_ids:
        supabase.table("certifications").delete().eq("id", cid).execute()
    print("Cleanup complete.")
else:
    print("All certifications are perfectly valid!")
