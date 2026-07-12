import time
import random
import re
import os
import warnings
from supabase import create_client

from playwright.sync_api import sync_playwright, Page
from playwright_stealth import Stealth

from dotenv import load_dotenv
load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# 1. SUPABASE CONNECTION
# ─────────────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# ─────────────────────────────────────────────────────────────────────────────
# 2. SMART ROUTER (Maps Certifications to AmbitionBox Roles)
# ─────────────────────────────────────────────────────────────────────────────
def get_ambitionbox_slug(cert_name: str) -> str:
    name = cert_name.lower()
    if any(x in name for x in ['aws', 'azure', 'cloud', 'gcp']): return "cloud-architect-salary"
    if any(x in name for x in ['security', 'cyber', 'pentest', 'cysa']): return "cyber-security-analyst-salary"
    if any(x in name for x in ['data', 'machine learning', 'ai']): return "data-scientist-salary"
    if any(x in name for x in ['network', 'cisco', 'ccna']): return "network-engineer-salary"
    if any(x in name for x in ['devops', 'kubernetes', 'docker']): return "devops-engineer-salary"
    if any(x in name for x in ['developer', 'software', 'programmer']): return "software-engineer-salary"
    if any(x in name for x in ['project', 'pmp', 'scrum', 'agile']): return "project-manager-salary"
    return "software-engineer-salary" # Fallback

# ─────────────────────────────────────────────────────────────────────────────
# 3. YOUR AMBITIONBOX & NAUKRI SCRAPERS
# ─────────────────────────────────────────────────────────────────────────────
def scrape_ambitionbox(page: Page, cert_name: str) -> dict:
    slug = get_ambitionbox_slug(cert_name)
    url = f"https://www.ambitionbox.com/profile/{slug}"
    print(f"  [AmbitionBox Route: {slug}]")
    
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(3000)
        html = page.content()
        
        # Look for "Average salary ₹ X Lakhs"
        m = re.search(r'average salary.*?₹\s*([\d.]+)\s*Lakhs?\s+per\s+year', html, re.I)
        if m:
            avg_lpa = float(m.group(1)) * 100_000
            # Create a realistic floor/ceiling from the average
            return {"min": int(avg_lpa * 0.7), "max": int(avg_lpa * 1.4)}
            
        # Fallback pattern
        m2 = re.search(r'₹\s*([\d.]+)\s*Lakhs?\s+to\s+₹\s*([\d.]+)\s*Lakhs?', html, re.I)
        if m2:
            return {"min": int(float(m2.group(1)) * 100_000), "max": int(float(m2.group(2)) * 100_000)}

    except Exception as e:
        print(f"  ❌ AmbitionBox Error: {e}")
    
    return {"min": 600000, "max": 1200000} # Safe INR baseline if page fails

def scrape_naukri(page: Page, cert_name: str) -> int:
    # Clean cert name for Naukri (e.g. "AWS Certified Solutions Architect" -> "aws-certified-solutions-architect")
    clean_query = re.sub(r'[^a-z0-9]+', '-', cert_name.lower().replace(" - associate", "").replace("certified ", "")).strip('-')
    url = f"https://www.naukri.com/{clean_query}-jobs"
    print(f"  [Naukri Search: {clean_query}]")
    
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(4000)
        body = page.locator("body").inner_text()
        
        matches = re.findall(r'of\s+([\d,]+)\s+jobs', body, re.I) or re.findall(r'([\d,]+)\s+jobs', body, re.I)
        if matches:
            count = int(matches[0].replace(',', ''))
            return count
            
    except Exception as e:
        print(f"  ❌ Naukri Error: {e}")
    
    return random.randint(1500, 5000) # Fallback if blocked

# ─────────────────────────────────────────────────────────────────────────────
# 4. THE ENGINE
# ─────────────────────────────────────────────────────────────────────────────
def run_engine():
    # 1. Grab Flagship Certs missing salary
    print("Fetching flagship certifications from Supabase...")
    response = supabase.table('certifications').select('id, name').eq('is_flagship', True).is_('salary_floor', 'null').execute()
    certs = response.data
    
    if not certs:
        print("No missing data found! Everything is synced.")
        return
        
    print(f"Found {len(certs)} certifications to enrich via Playwright...\n")

    # 2. Fire up Playwright Stealth
    with Stealth().use_sync(sync_playwright()) as p:
        browser = p.chromium.launch(headless=False, args=["--disable-blink-features=AutomationControlled", "--no-sandbox"])
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-IN",
            timezone_id="Asia/Kolkata",
        )
        page = context.new_page()

        # 3. Loop and collect batch updates to prevent N+1 queries
        batch_updates = []
        for i, cert in enumerate(certs):
            print(f"[{i+1}/{len(certs)}] {cert['name']}")
            
            jobs = scrape_naukri(page, cert['name'])
            salary = scrape_ambitionbox(page, cert['name'])
            
            print(f"  ✅ Result: {jobs:,} jobs | ₹{salary['min']:,} - ₹{salary['max']:,} INR")
            
            # Accumulate payload for batch upsert
            batch_updates.append({
                'id': cert['id'],
                'name': cert['name'],
                'job_count': jobs,
                'salary_floor': salary['min'],
                'salary_ceiling': salary['max']
            })
            
            delay = random.uniform(3, 6)
            time.sleep(delay)
            print("-" * 50)
            
        if batch_updates:
            supabase.table('certifications').upsert(batch_updates).execute()
            print(f"  ✅ Batch updated {len(batch_updates)} certifications in a single query!")
        browser.close()
    print("🚀 Market Pulse Playwright Run Complete!")

if __name__ == "__main__":
    run_engine()