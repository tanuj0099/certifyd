import os
from pathlib import Path
from dotenv import load_dotenv

# 1. Start where this file (supabase_uploader.py) lives
# 2. .parent goes to 'certifyd-scraper/'
# 3. .parent goes to the root folder
root_dir = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=root_dir / '.env.local')

from supabase import create_client, Client
from pydantic import ValidationError
from models import Certification

# Now it will reliably find your credentials regardless of where you run the script from
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"CRITICAL ERROR: Could not find variables in {root_dir / '.env.local'}")
    raise Exception("Missing Supabase credentials!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] supabase_uploader - %(message)s")
logger = logging.getLogger(__name__)

def upload_to_supabase(data_list: list[dict]) -> None:
    """
    Validates a list of dictionaries against the Certification Pydantic model.
    - Green Pipeline: Inserts valid records into the 'certifications' table.
    - Quarantine Queue: Inserts failed validation records into the 'quarantine_queue' table.
    """
    if not data_list:
        logger.info("No data provided to upload_to_supabase.")
        return

    valid_records = []
    quarantine_records = []

    for idx, item in enumerate(data_list):
        try:
            # 1. Validate the raw dictionary
            cert = Certification(**item)
            
            # 2. Map to the clean database schema explicitly to avoid PGRST204 errors
            
            raw_level = (cert.level or '').lower()
            if 'foundational' in raw_level or 'beginner' in raw_level or 'fundamentals' in raw_level:
                mapped_level = 'Foundational'
            elif 'associate' in raw_level or 'intermediate' in raw_level:
                mapped_level = 'Associate'
            elif 'professional' in raw_level or 'expert' in raw_level or 'advanced' in raw_level or 'specialty' in raw_level:
                mapped_level = 'Professional'
            else:
                mapped_level = 'Foundational'
                
            from datetime import datetime, timezone
            
            # Map vendor_id based on source URL
            vendor_id = None
            url_lower = cert.source_url.lower()
            if 'aws.amazon' in url_lower: vendor_id = '11111111-1111-1111-1111-111111111111'
            elif 'microsoft' in url_lower: vendor_id = '54dd3f65-0932-46e0-80d3-b56fcb1edae7'
            elif 'comptia' in url_lower: vendor_id = '6a09b4ce-a360-40b6-83f3-4650c905885d'
            elif 'cisco' in url_lower: vendor_id = 'b5a648a6-502e-4868-85e5-ad8d8badf490'
            elif 'lpi.org' in url_lower: vendor_id = '5c5e68ab-2a8a-4de9-a868-88aefe2f0e3f'
            elif 'google' in url_lower: vendor_id = '233f5097-b6d1-4006-ade4-8d336ad64e00'
            elif 'isc2.org' in url_lower: vendor_id = 'a12ea266-5028-4881-8f7a-9c9164e1f920'

            # Extract the slug
            url_parts = [p for p in cert.source_url.split('/') if p]
            if url_parts:
                slug = url_parts[-1]
            else:
                import re
                slug = re.sub(r'[^a-z0-9]+', '-', cert.title.lower()).strip('-')

            # Fallback for empty title
            final_title = cert.title if cert.title else slug.replace('-', ' ').title()

            cert_dict = {
                'vendor_id': vendor_id,
                'name': final_title,
                'slug': slug,
                'difficulty_level': mapped_level,
                'functional_track': 'General',
                'cost_inr': float(cert.cost_inr) if cert.cost_inr else 0.0,
                'cost_usd': float(cert.cost_usd) if cert.cost_usd else 0.0,
                'retake_cost_usd': 0.0,
                'requires_mandatory_training': False,
                'integrity_score': 10.0,
                'auto_renews_with_id': None,
                'prerequisite_cert_id': None,
                'exam_duration_minutes': cert.exam_duration_minutes if cert.exam_duration_minutes else 120,
                'total_questions': cert.total_questions if cert.total_questions else 60,
                'exam_format_type': cert.exam_format_type if cert.exam_format_type else 'Standard Proctored Exam',
                'testing_method': cert.testing_method if cert.testing_method else 'Online Proctored & Testing Center',
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'validity_period_months': cert.validity_period_months if cert.validity_period_months else 36,
                'overview': cert.overview if cert.overview else 'Comprehensive overview currently pending official documentation.',
                'eligibility': cert.eligibility if cert.eligibility else 'None explicitly stated. Open to all interested candidates.',
                'skills_measured': cert.skills_measured if cert.skills_measured and len(cert.skills_measured) > 0 else ['Refer to official exam blueprint for detailed domain weights.'],
                'prerequisites': cert.prerequisites if cert.prerequisites and len(cert.prerequisites) > 0 else ['No mandatory prerequisites required for this examination.'],
                'exam_code': cert.exam_code if cert.exam_code else f"PENDING-{slug}",
                'job_roles': cert.job_roles if cert.job_roles and len(cert.job_roles) > 0 else ['IT Professional'],
                'languages': cert.languages if cert.languages and len(cert.languages) > 0 else ['English'],
                'retirement_date': cert.retirement_date if cert.retirement_date else '2099-12-31',
                'source_url': cert.source_url,
            }

            valid_records.append(cert_dict)
            
        except ValidationError as e:
            logger.warning(f"Validation failed for record {idx}. Moving to quarantine queue.")
            # 3. If validation fails, prepare the quarantine record
            error_details = e.json()
            quarantine_records.append({
                "raw_data": item,
                "error_message": error_details,
            })
        except Exception as e:
            logger.error(f"Unexpected error processing record {idx}: {e}")
            quarantine_records.append({
                "raw_data": item,
                "error_message": str(e),
            })

    # 4. Upload valid records (Green Pipeline)
    if valid_records:
        # Deduplicate valid_records by 'slug' to avoid Postgres 21000 error during batch upsert
        unique_records = {}
        for r in valid_records:
            unique_records[r['slug']] = r
        deduped_records = list(unique_records.values())
        
        try:
            # Upsert relying on the 'slug' unique constraint to avoid duplicates on re-runs.
            response = supabase.table("certifications").upsert(deduped_records, on_conflict="slug").execute()
            logger.info(f"Successfully upserted {len(response.data)} records to 'certifications' table.")
        except Exception as e:
            logger.error(f"Error during Supabase upsert to 'certifications': {e}")

    # 5. Upload quarantined records
    if quarantine_records:
        try:
            # Insert into quarantine queue. Assumes Supabase Postgres table auto-generates PKs (like a UUID).
            response = supabase.table("quarantine_queue").insert(quarantine_records).execute()
            logger.info(f"Successfully inserted {len(response.data)} records to 'quarantine_queue' table.")
        except Exception as e:
            logger.error(f"Error during Supabase insert to 'quarantine_queue': {e}")

    logger.info(f"Supabase upload complete: {len(valid_records)} valid, {len(quarantine_records)} quarantined.")
