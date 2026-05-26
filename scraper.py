"""
CertifyROI Market Intelligence Scraper — V22 (Simple & Working)
===============================================================

SOLUTION: Remove all proxy complexity. Use AmbitionBox as primary source.
          It works without proxies, blocks, or timeouts.
          
          Payscale and Glassdoor are REMOVED — they require paid proxies.
          Naukri stays for job counts.
"""

import time
import re
import random
import os
import warnings
from dotenv import load_dotenv
from supabase import create_client
import posthog_client
import re
from supabase import create_client

from playwright.sync_api import sync_playwright, Page
from playwright_stealth import Stealth

# ─────────────────────────────────────────────────────────────────────────────
# 1. ENV & SUPABASE
# ─────────────────────────────────────────────────────────────────────────────
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    load_dotenv()

SUPABASE_URL = "https://ejgadkswcjorkyzkqhfl.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_KEY:
    print("WARNING: SUPABASE_KEY not found!")
    supabase = None
else:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─────────────────────────────────────────────────────────────────────────────
# 2. MASTER MANIFEST — 70 roles
# ─────────────────────────────────────────────────────────────────────────────
DOMAINS_TO_SCRAPE = [
    "Full Stack Developer", "Backend Engineer", "Frontend Developer", "DevOps Engineer", "Software Architect",
    "SRE (Site Reliability Engineer)", "Mobile App Developer", "iOS Developer", "Android Developer",
    "Blockchain Developer", "Embedded Systems Engineer", "Game Developer", "QA Automation Engineer",
    "Rust Developer", "Golang Developer", "Cloud Architect (AWS)", "Azure Architect", "GCP Engineer",
    "Data Scientist", "Data Analyst", "Machine Learning Engineer", "AI Researcher", "Data Engineer",
    "Business Intelligence Developer", "NLP Engineer", "Computer Vision Engineer", "Database Administrator",
    "Statistical Analyst", "Big Data Engineer", "AI Product Manager",
    "Cybersecurity Analyst", "Ethical Hacker", "Security Architect", "Information Security Manager",
    "Penetration Tester", "Cloud Security Specialist", "Network Engineer", "SOC Analyst",
    "Product Manager", "Project Manager", "Scrum Master", "Agile Coach", "Business Analyst",
    "Operations Manager", "Strategy Consultant", "Supply Chain Analyst", "Program Manager",
    "Management Trainee", "SAP Consultant", "Management Consultant",
    "UI/UX Designer", "Product Designer", "Interaction Designer", "Motion Designer", "Graphic Designer",
    "User Researcher", "Visual Designer", "Service Designer",
    "Digital Marketing Specialist", "SEO Specialist", "Performance Marketer", "Content Strategist",
    "Growth Hacker", "Social Media Manager", "Product Marketing Manager", "Sales Development Representative",
    "Financial Analyst", "Investment Banking Analyst", "Risk Manager", "Actuarial Analyst",
    "Equity Researcher", "Tax Consultant", "Audit Associate", "Quant Researcher", "Fintech Product Manager",
]

# ─────────────────────────────────────────────────────────────────────────────
# 3. CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
NULL_SALARY = {"min_salary": 0, "max_salary": 0, "source": None}

# ─────────────────────────────────────────────────────────────────────────────
# 4. CORE HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def _clean_query(domain: str) -> str:
    return re.sub(r'\s*\(.*?\)\s*', ' ', domain).strip()


def _parse_inr(text: str) -> float | None:
    text = text.strip().lower().replace(',', '').replace('₹', '')
    
    m = re.search(r'([\d.]+)\s*m\b', text)
    if m:
        return float(m.group(1)) * 1_000_000
    
    m = re.search(r'([\d.]+)\s*k\b', text)
    if m:
        return float(m.group(1)) * 1_000
    
    m = re.search(r'([\d.]+)\s*(?:l|lpa)\b', text)
    if m:
        return float(m.group(1)) * 100_000
    
    m = re.search(r'^([\d.]+)$', text)
    if m:
        val = float(m.group(1))
        if val < 100:
            return val * 100_000
        return val
    
    return None


def _validate_range(lo: float, hi: float) -> dict | None:
    if not (lo and hi):
        return None
    lo, hi = float(lo), float(hi)
    if lo > hi:
        lo, hi = hi, lo
    if 100_000 <= lo <= 50_000_000 and 100_000 <= hi <= 50_000_000 and lo <= hi:
        return {"min": lo, "max": hi}
    return None


# ─────────────────────────────────────────────────────────────────────────────
# 5. AMBITIONBOX — PRIMARY SOURCE (works without proxies)
# ─────────────────────────────────────────────────────────────────────────────
AMBITIONBOX_SLUGS = {
    "full stack developer": "full-stack-developer-salary",
    "backend engineer": "backend-developer-salary",
    "frontend developer": "front-end-developer-salary",  # FIXED: was "frontend-developer-salary"
    "devops engineer": "devops-engineer-salary",
    "software architect": "software-architect-salary",
    "data scientist": "data-scientist-salary",
    "data analyst": "data-analyst-salary",
    "machine learning engineer": "machine-learning-engineer-salary",
    "data engineer": "data-engineer-salary",
    "product manager": "product-manager-salary",
    "sre (site reliability engineer)": "site-reliability-engineer-salary",
    "ios developer": "ios-developer-salary",
    "android developer": "android-developer-salary",
    "mobile app developer": "mobile-application-developer-salary",
    "cloud architect (aws)": "cloud-architect-salary",
    "qa automation engineer": "qa-automation-engineer-salary",
    "business analyst": "business-analyst-salary",
    "ui/ux designer": "ux-designer-salary",
    "security architect": "security-architect-salary",
    "cybersecurity analyst": "cyber-security-analyst-salary",
    "network engineer": "network-engineer-salary",
    "database administrator": "database-administrator-salary",
    "scrum master": "scrum-master-salary",
    "nlp engineer": "nlp-engineer-salary",
    "computer vision engineer": "computer-vision-engineer-salary",
    "big data engineer": "big-data-engineer-salary",
    "ai researcher": "artificial-intelligence-engineer-salary",
    "game developer": "game-developer-salary",
    "blockchain developer": "blockchain-developer-salary",
    "embedded systems engineer": "embedded-software-engineer-salary",
    "golang developer": "golang-developer-salary",
    "rust developer": "rust-developer-salary",
    "financial analyst": "financial-analyst-salary",
    "seo specialist": "seo-specialist-salary",
    "digital marketing specialist": "digital-marketing-specialist-salary",
    "graphic designer": "graphic-designer-salary",
    "content strategist": "content-strategist-salary",
    "penetration tester": "penetration-tester-salary",
    "ethical hacker": "ethical-hacker-salary",
    "information security manager": "information-security-manager-salary",
    "soc analyst": "soc-analyst-salary",
    "cloud security specialist": "cloud-security-engineer-salary",
    "operations manager": "operations-manager-salary",
    "program manager": "program-manager-salary",
    "project manager": "project-manager-salary",
    "management consultant": "management-consultant-salary",
    "sap consultant": "sap-consultant-salary",
    "supply chain analyst": "supply-chain-analyst-salary",
    "strategy consultant": "strategy-consultant-salary",
    "agile coach": "agile-coach-salary",
    "management trainee": "management-trainee-salary",
    "user researcher": "user-researcher-salary",
    "product designer": "product-designer-salary",
    "interaction designer": "interaction-designer-salary",
    "motion designer": "motion-designer-salary",
    "visual designer": "visual-designer-salary",
    "service designer": "service-designer-salary",
    "social media manager": "social-media-manager-salary",
    "performance marketer": "performance-marketing-manager-salary",
    "product marketing manager": "product-marketing-manager-salary",
    "growth hacker": "growth-hacker-salary",
    "sales development representative": "sales-development-representative-salary",
    "fintech product manager": "product-manager-salary",
    "ai product manager": "product-manager-salary",
    "statistical analyst": "statistical-analyst-salary",
    "business intelligence developer": "business-intelligence-developer-salary",
    "gcp engineer": "cloud-engineer-salary",
    "azure architect": "azure-architect-salary",
    "risk manager": "risk-manager-salary",
    "actuarial analyst": "actuarial-analyst-salary",
    "quant researcher": "quantitative-researcher-salary",
    "tax consultant": "tax-consultant-salary",
    "audit associate": "auditor-salary",
    "equity researcher": "equity-research-analyst-salary",
    "investment banking analyst": "investment-banking-analyst-salary",
}

def _ambitionbox_slug(domain: str) -> str:
    key = _clean_query(domain).lower()
    return AMBITIONBOX_SLUGS.get(key, re.sub(r'[^a-z0-9]+', '-', key).strip('-') + "-salary")


def scrape_ambitionbox(page: Page, domain: str) -> dict:
    """Fetch AmbitionBox via Playwright. No proxies needed."""
    slug = _ambitionbox_slug(domain)
    url = f"https://www.ambitionbox.com/profile/{slug}"
    print(f"  [AmbitionBox] {url}")
    
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(3000)
        
        html = page.content()
        title = page.title()
        
        # Check if page is valid
        if "not found" in title.lower() or "404" in title.lower():
            print(f"    ⚠️ Page not found: {title}")
            return NULL_SALARY.copy()
        
        # Pattern 1: "₹ 4.0 Lakhs to ₹ 30.6 Lakhs per year"
        m = re.search(r'₹\s*([\d.]+)\s*Lakhs?\s+to\s+₹\s*([\d.]+)\s*Lakhs?\s+per\s+year', html, re.I)
        if m:
            lo = float(m.group(1)) * 100_000
            hi = float(m.group(2)) * 100_000
            r = _validate_range(lo, hi)
            if r:
                print(f"    ✅ Range: ₹{r['min']:,.0f} - ₹{r['max']:,.0f}")
                return {"min_salary": int(r["min"]), "max_salary": int(r["max"]), "source": "ambitionbox"}
        
        # Pattern 2: Experience table "Fresher ₹5.0 Lakhs to ₹6.4 Lakhs per year"
        m = re.search(r'Fresher.*?₹\s*([\d.]+)\s*Lakhs?\s+to\s+₹\s*([\d.]+)\s*Lakhs?', html, re.I | re.S)
        if m:
            lo = float(m.group(1)) * 100_000
            hi = float(m.group(2)) * 100_000
            r = _validate_range(lo, hi)
            if r:
                print(f"    ✅ Fresher range: ₹{r['min']:,.0f} - ₹{r['max']:,.0f}")
                return {"min_salary": int(r["min"]), "max_salary": int(r["max"]), "source": "ambitionbox"}
        
        # Pattern 3: Average salary
        m = re.search(r'average salary.*?₹\s*([\d.]+)\s*Lakhs?\s+per\s+year', html, re.I)
        if m:
            avg = float(m.group(1)) * 100_000
            r = _validate_range(avg * 0.6, avg * 1.8)
            if r:
                print(f"    ✅ Avg estimate: ₹{r['min']:,.0f} - ₹{r['max']:,.0f}")
                return {"min_salary": int(r["min"]), "max_salary": int(r["max"]), "source": "ambitionbox"}
        
        print(f"    ❌ No salary data found")
        
    except Exception as e:
        print(f"    ❌ Error: {e}")
    
    return NULL_SALARY.copy()


# ─────────────────────────────────────────────────────────────────────────────
# 6. NAUKRI JOB COUNT
# ─────────────────────────────────────────────────────────────────────────────
def _naukri_slug(domain: str) -> str:
    base = re.sub(r'\(.*?\)', '', domain).strip().lower()
    return re.sub(r'[^a-z0-9]+', '-', base).strip('-')


def scrape_naukri(page: Page, domain: str) -> int:
    slug = _naukri_slug(domain)
    url = f"https://www.naukri.com/{slug}-jobs"
    print(f"  [Naukri] {url}")
    
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        for attempt in range(2):
            page.wait_for_timeout(4000)
            body = page.locator("body").inner_text()
            matches = (
                re.findall(r'of\s+([\d,]+)\s+jobs', body, re.I) or
                re.findall(r'([\d,]+)\s+jobs', body, re.I)
            )
            if matches:
                count = int(matches[0].replace(',', ''))
                print(f"    ✅ {count} jobs")
                return count
            if attempt == 0:
                print(f"    Retrying...")
    except Exception as e:
        print(f"    ❌ Error: {e}")
    
    return 0


# ─────────────────────────────────────────────────────────────────────────────
# 7. MAIN ENGINE
# ─────────────────────────────────────────────────────────────────────────────
def get_market_data(page: Page, domain: str) -> dict:
    """Simple: AmbitionBox for salary, Naukri for jobs."""
    
    # Salary from AmbitionBox
    salary = scrape_ambitionbox(page, domain)
    
    # Job count from Naukri
    jobs = scrape_naukri(page, domain)
    
    return {
        "min_salary": salary["min_salary"],
        "max_salary": salary["max_salary"],
        "job_count": jobs,
        "source": salary["source"],
    }


def run_engine():
    with Stealth().use_sync(sync_playwright()) as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-IN",
            timezone_id="Asia/Kolkata",
        )
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en-GB', 'en'] });
            window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
        """)
        
        page = context.new_page()
        
        # Test with first 4 roles (change [:4] to [:] for full run)
        test_domains = DOMAINS_TO_SCRAPE
        results_log = []

        posthog_client.capture("scraper", "market_scrape_run_started", {
            "total_domains": len(test_domains),
        })

        for i, domain in enumerate(test_domains):
            print(f"\n{'='*60}")
            print(f"[{i+1}/{len(test_domains)}] {domain}")
            print(f"{'='*60}")
            
            stats = get_market_data(page, domain)
            lo_l = stats["min_salary"] / 100_000 if stats["min_salary"] else 0
            hi_l = stats["max_salary"] / 100_000 if stats["max_salary"] else 0
            
            payload = {
                "domain_name": domain,
                "min_salary": stats["min_salary"],
                "max_salary": stats["max_salary"],
                "job_count_naukri": stats["job_count"],
                "updated_at": "now()",
            }
            
            try:
                if supabase:
                    supabase.table("market_intelligence").upsert(
                        payload, on_conflict="domain_name"
                    ).execute()
                    status = "SAVED"
                else:
                    status = "NO_DB"
            except Exception as e:
                print(f"\n  DB Error: {e}")
                status = "DB_FAIL"
            
            results_log.append({
                "domain": domain,
                "min_lpa": f"{lo_l:.1f}",
                "max_lpa": f"{hi_l:.1f}",
                "jobs": stats["job_count"],
                "status": status,
                "source": stats.get("source", "none"),
            })
            
            print(f"\n  [{status}] INR {lo_l:.1f}L-{hi_l:.1f}L | {stats['job_count']} jobs | Source: {stats.get('source', 'none')}")

            posthog_client.capture("scraper", "market_domain_scraped", {
                "domain": domain,
                "min_salary": stats["min_salary"],
                "max_salary": stats["max_salary"],
                "job_count": stats["job_count"],
                "source": stats.get("source"),
                "success": stats["min_salary"] > 0,
            })

            # Small delay between roles
            if i < len(test_domains) - 1:
                delay = random.uniform(3, 6)
                print(f"  [Delay] {delay:.1f}s...")
                time.sleep(delay)
        
        browser.close()
    
    # Summary
    print(f"\n{'='*60}")
    print("RUN SUMMARY")
    print(f"{'='*60}")
    hits = sum(1 for r in results_log if float(r["min_lpa"]) > 0)
    print(f"  Success rate: {hits}/{len(results_log)}")
    for r in results_log:
        flag = "✅" if float(r["min_lpa"]) > 0 else "❌"
        print(f"  {flag} {r['domain']:<40} {r['min_lpa']}-{r['max_lpa']} LPA | {r['jobs']} jobs | {r['source']}")
    print(f"{'='*60}\nDONE.")

    posthog_client.capture("scraper", "market_scrape_run_completed", {
        "total_domains": len(results_log),
        "success_count": hits,
        "failure_count": len(results_log) - hits,
    })
    posthog_client.shutdown()

supabase = create_client("https://ejgadkswcjorkyzkqhfl.supabase.co", "YOUR_SUPABASE_KEY")

def save_scraped_certification(cert_name, cost, difficulty, months, roi):
    # Auto-generate a clean URL slug (e.g., "AWS Certified Cloud Practitioner" -> "aws-certified-cloud-practitioner")
    clean_slug = cert_name.lower().strip()
    clean_slug = re.sub(r'[^a-z0-True0-9\s-]', '', clean_slug) # Strip out punctuation/symbols
    clean_slug = re.sub(r'[\s-]+', '-', clean_slug)           # Collapse spaces and hyphens into single hyphens

    scraped_data = {
        "slug": clean_slug,
        "name": cert_name,
        "cost_inr": int(cost),
        "difficulty": difficulty,
        "time_commitment_months": int(months),
        "median_roi_percent": int(roi)
    }

    # 2. Push to Supabase. Upsert handles infinite scaling seamlessly.
    supabase.table("certifications").upsert(scraped_data).execute()
    print(f"Successfully synchronized: {clean_slug}")

if __name__ == "__main__":
    run_engine()