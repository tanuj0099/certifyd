"""
CertifyROI Market Intelligence Scraper — V14 (SIMPLIFIED)
==========================================================

What all the screenshots told us:
  ❌ Google     → reCAPTCHA
  ❌ Bing       → Cloudflare challenge
  ❌ DuckDuckGo → Glassdoor not indexed, no results
  ❌ Glassdoor  → "Humans only" Cloudflare wall — DROPPED PERMANENTLY

FINAL SIMPLE ARCHITECTURE:
  SALARY  → Payscale India internal search API → navigate → extract
  JOBS    → Naukri.com (unchanged, working)
  DB      → Supabase upsert (unchanged)

No search engines. No Glassdoor. No slug guessing.
Just Payscale's own API giving us the exact URL, then we go get the data.
"""

import time
import re
import json
import random
import threading
import os
from dotenv import load_dotenv
from supabase import create_client
from urllib.parse import quote_plus
from playwright.sync_api import sync_playwright, Page, Response
from supabase import create_client
from playwright_stealth import Stealth


# ─────────────────────────────────────────────────────────────────────────────
# 1. SUPABASE
# ─────────────────────────────────────────────────────────────────────────────
load_dotenv()
SUPABASE_URL = "https://ejgadkswcjorkyzkqhfl.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY") # <-- Now it's hidden!

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
# ─────────────────────────────────────────────────────────────────────────────
# 2. MASTER MANIFEST
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
NULL_SALARY = {"min_salary": 0, "max_salary": 0}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]

VIEWPORTS = [
    {"width": 1920, "height": 1080},
    {"width": 1440, "height": 900},
    {"width": 1536, "height": 864},
]


# ─────────────────────────────────────────────────────────────────────────────
# 4. HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def _clean_query(domain: str) -> str:
    """'SRE (Site Reliability Engineer)' → 'SRE'"""
    return re.sub(r'\s*\(.*?\)\s*', ' ', domain).strip()


def _to_rupees(val: float) -> float:
    """Convert Lakhs to rupees if value looks like Lakhs (<500)."""
    return val * 100_000 if val < 500 else val


def _validate_inr(lo: float, hi: float) -> dict | None:
    """Only accept realistic Indian salary ranges."""
    if 100_000 <= lo <= 50_000_000 and 100_000 <= hi <= 50_000_000 and lo <= hi:
        return {"min": lo, "max": hi}
    return None


def _parse_node(node) -> dict | None:
    """
    Try to extract a salary min/max from a dict node.
    Handles the most common shapes returned by salary APIs.
    """
    if not isinstance(node, dict):
        return None

    MIN_KEYS = ("min", "minValue", "minimum", "low", "p10", "lowerBound", "salaryMin", "bottom")
    MAX_KEYS = ("max", "maxValue", "maximum", "high", "p90", "upperBound", "salaryMax", "top")

    # Shape 1: {min: X, max: Y}
    for mk in MIN_KEYS:
        for xk in MAX_KEYS:
            if mk in node and xk in node:
                try:
                    lo = _to_rupees(float(node[mk]))
                    hi = _to_rupees(float(node[xk]))
                    r = _validate_inr(lo, hi)
                    if r:
                        return r
                except (TypeError, ValueError):
                    continue

    # Shape 2: nested under sub-key
    for sub in ("value", "salary", "annual", "base", "compensation", "range"):
        if sub in node:
            r = _parse_node(node[sub])
            if r:
                return r

    # Shape 3: percentile array
    for arr_key in ("percentiles", "distribution"):
        arr = node.get(arr_key)
        if isinstance(arr, list) and len(arr) >= 2:
            vals = []
            for item in arr:
                if isinstance(item, dict):
                    v = item.get("value") or item.get("salary") or item.get("amount")
                    if v:
                        rupees = _to_rupees(float(v))
                        if 100_000 <= rupees <= 50_000_000:
                            vals.append(rupees)
            if len(vals) >= 2:
                r = _validate_inr(min(vals), max(vals))
                if r:
                    return r

    return None


def _walk(obj, depth=0) -> dict | None:
    """Recursively walk any JSON structure looking for salary data."""
    if depth > 7:
        return None
    if isinstance(obj, dict):
        r = _parse_node(obj)
        if r:
            return r
        for v in obj.values():
            r = _walk(v, depth + 1)
            if r:
                return r
    if isinstance(obj, list):
        for item in obj[:10]:
            r = _walk(item, depth + 1)
            if r:
                return r
    return None


# ─────────────────────────────────────────────────────────────────────────────
# 5. NETWORK INTERCEPTOR
#    Attaches BEFORE navigation, catches all JSON responses as the page loads.
#    Payscale fires background XHR calls to populate its salary chart.
# ─────────────────────────────────────────────────────────────────────────────
class SalaryInterceptor:

    SKIP = ["analytics", "gtm", "segment", "sentry", "datadog",
            "hotjar", "doubleclick", "facebook", ".js", ".css",
            ".png", ".jpg", ".svg", ".woff", "cloudfront"]

    def __init__(self):
        self._result: dict | None = None
        self._lock   = threading.Lock()
        self._active = True

    @property
    def result(self):
        with self._lock:
            return self._result

    def attach(self, page: Page):
        page.on("response", self._on_response)

    def detach(self, page: Page):
        self._active = False
        try:
            page.remove_listener("response", self._on_response)
        except Exception:
            pass

    def _on_response(self, response: Response):
        if not self._active or self.result:
            return

        ct  = response.headers.get("content-type", "")
        url = response.url.lower()

        if "json" not in ct:
            return
        if any(s in url for s in self.SKIP):
            return

        # Log API-looking endpoints for debugging
        if any(x in url for x in ["/api/", "salary", "compensation", "research", "survey"]):
            print(f"    [WIRE] {response.url[:100]}")

        try:
            body = response.json()
        except Exception:
            return

        r = _walk(body)
        if r:
            with self._lock:
                if not self._result:
                    self._result = r
                    print(f"    [WIRE] ✅ ₹{r['min']:,.0f} – ₹{r['max']:,.0f}")


# ─────────────────────────────────────────────────────────────────────────────
# 6. __NEXT_DATA__ EXTRACTOR (Tier 0 — fastest, no XHR needed)
#    Payscale is Next.js. All server-side data lives in a <script id="__NEXT_DATA__">
#    tag already embedded in the HTML. We parse that directly.
# ─────────────────────────────────────────────────────────────────────────────
def extract_next_data(page: Page) -> dict | None:
    try:
        raw = page.evaluate("""
            () => {
                const el = document.getElementById('__NEXT_DATA__');
                return el ? el.textContent : null;
            }
        """)
        if not raw:
            return None

        data       = json.loads(raw)
        page_props = (data.get("props") or {}).get("pageProps") or {}

        # Walk every known key path Payscale has used
        paths = [
            ["salaryData"], ["salary"], ["compensationData"],
            ["profileData", "salary"], ["profileData", "salaryRange"],
            ["initialData", "salary"], ["serverProps", "salaryData"],
            ["dehydratedState", "queries"],
        ]

        for path in paths:
            node = page_props
            for k in path:
                node = (node or {}).get(k)
            if not node:
                continue
            # React Query cache is a list of {state: {data: ...}}
            if isinstance(node, list):
                for item in node:
                    candidate = (item.get("state") or {}).get("data") or item
                    r = _walk(candidate)
                    if r:
                        print(f"    [NEXT_DATA] ✅ via {path} → ₹{r['min']:,.0f}–₹{r['max']:,.0f}")
                        return r
            else:
                r = _walk(node)
                if r:
                    print(f"    [NEXT_DATA] ✅ via {path} → ₹{r['min']:,.0f}–₹{r['max']:,.0f}")
                    return r

        # Full tree walk as last resort
        r = _walk(page_props)
        if r:
            print(f"    [NEXT_DATA] ✅ full walk → ₹{r['min']:,.0f}–₹{r['max']:,.0f}")
            return r

    except Exception as e:
        print(f"    [NEXT_DATA] error: {e}")

    return None


# ─────────────────────────────────────────────────────────────────────────────
# 7. PAYSCALE INTERNAL API — URL RESOLVER
#    Calls Payscale's own search endpoint from inside the browser (same-origin).
#    Returns a canonical /research/IN/Job=.../Salary URL.
#    No external service. No CAPTCHA. This is literally what their search bar uses.
# ─────────────────────────────────────────────────────────────────────────────
def resolve_payscale_url(page: Page, domain: str) -> str | None:
    query = quote_plus(_clean_query(domain))
    api   = f"https://www.payscale.com/api/v2/search/jobs?term={query}&country=IN"
    print(f"    [PS-API] Querying: {api}")

    # Must be on payscale.com for same-origin fetch
    if "payscale.com" not in page.url:
        try:
            page.goto(
                "https://www.payscale.com/research/IN/Country=India/Salary",
                wait_until="domcontentloaded",
                timeout=25_000,
            )
            page.wait_for_timeout(random.randint(1500, 2500))
        except Exception as e:
            print(f"    [PS-API] Cannot load payscale.com: {e}")
            return None

    try:
        result = page.evaluate(f"""
            async () => {{
                try {{
                    const r = await fetch("{api}", {{
                        headers: {{
                            "Accept":           "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                            "Referer":          "https://www.payscale.com/"
                        }}
                    }});
                    if (!r.ok) return null;
                    return await r.json();
                }} catch(e) {{ return null; }}
            }}
        """)

        if not result:
            print(f"    [PS-API] Empty or failed response.")
            return None

        # Normalise response shape (list vs wrapped object)
        items = result if isinstance(result, list) else (
            result.get("data") or result.get("results") or result.get("jobs") or []
        )

        if not items:
            print(f"    [PS-API] No items returned.")
            return None

        query_words = set(_clean_query(domain).lower().split())
        best_url, best_score = None, -1

        for item in items[:8]:
            rel = (
                item.get("url") or item.get("profileUrl") or
                item.get("canonicalUrl") or item.get("path") or ""
            )
            # Only accept India salary pages
            if "/IN/" not in rel or "/Salary" not in rel:
                continue

            label = (
                item.get("name") or item.get("title") or
                item.get("label") or item.get("jobTitle") or ""
            ).lower()

            score = len(query_words & set(re.findall(r'\w+', label)))
            if score > best_score:
                best_score = score
                best_url   = f"https://www.payscale.com{rel}"

        if best_url:
            print(f"    [PS-API] ✅ → {best_url}")
        else:
            print(f"    [PS-API] No /IN/Salary URL in response.")

        return best_url

    except Exception as e:
        print(f"    [PS-API] Exception: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 8. HUMAN SCROLL — triggers lazy-loaded XHR calls
# ─────────────────────────────────────────────────────────────────────────────
def human_scroll(page: Page):
    for y in [300, 600, 900, 1200, 800, 400]:
        try:
            page.evaluate(f"window.scrollTo({{top:{y}, behavior:'smooth'}})")
            page.wait_for_timeout(random.randint(300, 700))
        except Exception:
            break


# ─────────────────────────────────────────────────────────────────────────────
# 9. PAYSCALE SALARY SCRAPER — the complete pipeline
# ─────────────────────────────────────────────────────────────────────────────
def scrape_payscale(page: Page, domain: str) -> dict:
    """
    Step 1: Call Payscale's own search API → get canonical URL
    Step 2: Attach interceptor (must be before navigation)
    Step 3: Navigate to the salary page
    Step 4: Try __NEXT_DATA__ (fastest)
    Step 5: Human scroll → wait for XHR interception
    """
    print(f"\n  [PAYSCALE] '{domain}'")

    # Step 1: Resolve URL via Payscale's own API
    url = resolve_payscale_url(page, domain)
    if not url:
        print(f"    [PS] Could not resolve URL. Returning 0.")
        return NULL_SALARY

    # Step 2: Attach interceptor BEFORE navigation
    interceptor = SalaryInterceptor()
    interceptor.attach(page)

    # Step 3: Navigate
    print(f"    [PS] Navigating → {url}")
    try:
        resp = page.goto(url, wait_until="domcontentloaded", timeout=35_000)
        if resp and resp.status == 404:
            print(f"    [PS] 404.")
            interceptor.detach(page)
            return NULL_SALARY
    except Exception as e:
        print(f"    [PS] Navigation error: {e}")
        interceptor.detach(page)
        return NULL_SALARY

    # Soft-404 check
    title = page.title().lower()
    if any(x in title for x in ["not found", "error", "oops", "captcha", "blocked"]):
        print(f"    [PS] Blocked/404: '{page.title()}'")
        interceptor.detach(page)
        return NULL_SALARY

    page.wait_for_timeout(random.randint(2000, 3500))

    # Step 4: __NEXT_DATA__ (Tier 0 — instant)
    result = extract_next_data(page)
    if result:
        interceptor.detach(page)
        return {"min_salary": int(result["min"]), "max_salary": int(result["max"])}

    # Step 5: Scroll → wait for XHR interception (Tier 1)
    print(f"    [PS] __NEXT_DATA__ empty — scrolling for XHR...")
    human_scroll(page)

    for _ in range(30):          # poll up to 15 seconds
        page.wait_for_timeout(random.randint(400, 600))
        if interceptor.result:
            break

    interceptor.detach(page)

    r = interceptor.result
    if not r:
        print(f"    [PS] No salary data found after all tiers.")
        return NULL_SALARY

    return {"min_salary": int(r["min"]), "max_salary": int(r["max"])}


# ─────────────────────────────────────────────────────────────────────────────
# 10. NAUKRI JOB COUNT — unchanged, working
# ─────────────────────────────────────────────────────────────────────────────
def _slug(domain: str) -> str:
    base = re.sub(r'\(.*?\)', '', domain).strip().lower()
    return re.sub(r'[^a-z0-9]+', '-', base).strip('-')


def scrape_naukri_jobs(page: Page, domain: str) -> int:
    slug = _slug(domain)
    print(f"\n  [Naukri] '{domain}' → /{slug}-jobs")
    try:
        page.goto(
            f"https://www.naukri.com/{slug}-jobs",
            wait_until="domcontentloaded",
            timeout=30_000,
        )
        for attempt in range(2):
            page.wait_for_timeout(4_000)
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
        print(f"    No job count found.")
    except Exception as e:
        print(f"    [Naukri] Error: {e}")
    return 0


# ─────────────────────────────────────────────────────────────────────────────
# 11. UNIFIED get_market_data
# ─────────────────────────────────────────────────────────────────────────────
def get_market_data(page: Page, domain: str) -> dict:
    salary = scrape_payscale(page, domain)
    jobs   = scrape_naukri_jobs(page, domain)
    return {
        "min_salary": salary["min_salary"],
        "max_salary": salary["max_salary"],
        "job_count":  jobs,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 12. THE ENGINE
# ─────────────────────────────────────────────────────────────────────────────
def run_engine():
    with Stealth().use_sync(sync_playwright()) as p:

        browser = p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport=random.choice(VIEWPORTS),
            locale="en-IN",
            timezone_id="Asia/Kolkata",
            extra_http_headers={
                "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8",
                "DNT": "1",
            },
        )

        page = context.new_page()

        # Mask automation signals
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver',  { get: () => undefined });
            Object.defineProperty(navigator, 'plugins',    { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages',  { get: () => ['en-IN', 'en-GB', 'en'] });
            window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
        """)

        # ── Change [:4] to [:] for a full production run ──
        test_domains = DOMAINS_TO_SCRAPE[:4]

        for i, domain in enumerate(test_domains):
            print(f"\n{'='*60}")
            print(f"[{i+1}/{len(test_domains)}] {domain}")
            print(f"{'='*60}")

            stats = get_market_data(page, domain)
            lo_l  = stats["min_salary"] / 100_000
            hi_l  = stats["max_salary"] / 100_000

            payload = {
                "domain_name":      domain,
                "min_salary":       stats["min_salary"],
                "max_salary":       stats["max_salary"],
                "job_count_naukri": stats["job_count"],
                "updated_at":       "now()",
            }

            try:
                supabase.table("market_intelligence").upsert(
                    payload, on_conflict="domain_name"
                ).execute()
                print(f"\n  ✅ Saved — ₹{lo_l:.1f}L–₹{hi_l:.1f}L | {stats['job_count']} jobs")
            except Exception as e:
                print(f"\n  ❌ DB Error: {e}")

            # Wait between domains to avoid rate-limiting
            time.sleep(random.uniform(5, 10))

        browser.close()
        print(f"\n{'='*60}")
        print("DONE.")
        print(f"{'='*60}")


if __name__ == "__main__":
    run_engine()