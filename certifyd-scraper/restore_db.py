import os
import csv
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

root_dir = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=root_dir / '.env.local')

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def safe_json_load(val):
    if not val: return []
    try:
        return json.loads(val.replace('""', '"'))
    except:
        return [val]

def restore():
    print("WARNING: Deleting all current records in `certifications`...")
    # Get all IDs first to delete them since Supabase delete needs a filter
    response = supabase.table('certifications').select('id').execute()
    ids = [r['id'] for r in response.data]
    if ids:
        for i in range(0, len(ids), 100):
            batch = ids[i:i+100]
            supabase.table('certifications').delete().in_('id', batch).execute()
    print("Deleted old records.")

    csv_path = "certifications_rows (1).csv"
    to_insert = []
    
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse costs correctly knowing Microsoft used INR in the USD column
            base_cost = float(row['base_cost_usd']) if row['base_cost_usd'] else 0.0
            slug = row['slug'].lower()
            
            if ('microsoft' in slug or 'azure' in slug or 'm365' in slug or 'github' in slug or 'power' in slug) and base_cost > 2000:
                cost_inr = base_cost
                if base_cost == 4865.0: cost_usd = 165.0
                elif base_cost == 3691.0: cost_usd = 99.0
                else: cost_usd = round(base_cost / 83.5, 2)
            else:
                cost_usd = base_cost
                cost_inr = round(base_cost * 83.5, 2)

            cert_dict = {
                'id': row['id'],
                'vendor_id': row['vendor_id'] if row['vendor_id'] else None,
                'slug': row['slug'],
                'name': row['name'] if row['name'] else row['slug'],
                'exam_code': row['exam_code'] if row['exam_code'] else f"PENDING-{row['slug']}",
                'difficulty_level': row['difficulty_level'] if row['difficulty_level'] else 'Foundational',
                'functional_track': row['functional_track'] if row['functional_track'] else 'General',
                'validity_period_months': int(row['validity_period_months']) if row['validity_period_months'] else 36,
                'cost_inr': cost_inr,
                'cost_usd': cost_usd,
                'retake_cost_usd': float(row['retake_cost_usd']) if row['retake_cost_usd'] else 0.0,
                'requires_mandatory_training': row['requires_mandatory_training'].lower() == 'true',
                'integrity_score': float(row['integrity_score']) if row['integrity_score'] else 10.0,
                'exam_duration_minutes': int(row['exam_duration_minutes']) if row['exam_duration_minutes'] else 120,
                'total_questions': int(row['total_questions']) if row['total_questions'] else 60,
                'exam_format_type': row['exam_format_type'] if row['exam_format_type'] else 'Standard Proctored Exam',
                'testing_method': row['testing_method'] if row['testing_method'] else 'Online Proctored & Testing Center',
                'overview': row['about_description'] if row['about_description'] else 'Description pending.',
                'eligibility': row['eligibility_criteria'] if row['eligibility_criteria'] else 'None stated.',
                'skills_measured': safe_json_load(row['skills_measured']),
                'prerequisites': safe_json_load(row['prerequisites']),
                'job_roles': safe_json_load(row['job_roles']),
                'languages': safe_json_load(row['languages']),
                'retirement_date': row['retirement_date'] if row['retirement_date'] else '2099-12-31',
                'source_url': row['source_url'] if row['source_url'] else f"https://example.com/{row['slug']}",
            }
            
            # Remove any keys that are purely empty strings for foreign keys
            if row.get('auto_renews_with_id'): cert_dict['auto_renews_with_id'] = row['auto_renews_with_id']
            if row.get('prerequisite_cert_id'): cert_dict['prerequisite_cert_id'] = row['prerequisite_cert_id']

            to_insert.append(cert_dict)

    print(f"Prepared {len(to_insert)} original records for insertion.")
    
    # Insert in batches of 50
    success = 0
    for i in range(0, len(to_insert), 50):
        batch = to_insert[i:i+50]
        try:
            res = supabase.table('certifications').upsert(batch).execute()
            success += len(res.data)
        except Exception as e:
            print(f"Error inserting batch: {e}")
            
    print(f"Successfully restored {success} original records to Supabase.")

if __name__ == "__main__":
    restore()
