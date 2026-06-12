"""
main.py — Phase 3: Data extraction pipeline for the Certifyd scraping system.

Phase 3 upgrades over Phase 2:
  - Two-route architecture: INDEX handler enqueues detail page URLs;
    DETAIL handler extracts structured data and persists it via push_data().
  - All locators grounded in a live DOM audit of the real MS Learn pages
    (fetched and inspected before writing a single selector).
  - Crawlee's dataset writer auto-creates ./storage/datasets/default/ and
    writes one JSON file per certification record.

DOM audit findings (Microsoft Learn credential detail pages):
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Field            │ Source in DOM                                    │
  ├─────────────────────────────────────────────────────────────────────┤
  │ title            │ <h1>  (first and only h1 per page)               │
  │ tagline          │ <meta name="og:description"> content attr        │
  │ overview         │ prose paragraphs under the "## Overview" <h2>   │
  │ skills_measured  │ <li> items under "Assessed on this exam" <h3>   │
  │ prerequisites    │ <li> items under "## Prerequisites" <h2>        │
  │                  │ (absent on many pages — extracted defensively)   │
  │ exam_code        │ parsed from the "Exam AZ-XXX" heading text       │
  │ source_url       │ context.request.url                              │
  └─────────────────────────────────────────────────────────────────────┘

  The browse/credentials index page renders its cert card grid entirely
  via client-side React — no <a> tags exist in the static HTML.  The
  correct seeding strategy is therefore:
    (a) Wait for JS hydration on the index page, then extract rendered
        anchor hrefs via page.eval_on_selector_all(), and
    (b) Pass the resulting URL list as explicit requests= to enqueue_links().
  This is implemented in the INDEX handler below.

Architecture notes (Principal Architect):
  - Route labels ("INDEX", "DETAIL") act as the type system for the crawl
    graph.  Every URL in the queue carries a label; the router dispatches
    to the matching handler.  This is cleaner and more testable than a
    single handler with if/elif branching on URL patterns.
  - push_data() writes to the default Crawlee dataset, which auto-creates
    ./storage/datasets/default/{uuid}.json per record.  In Phase 4 this
    will be replaced (or shadowed) by the Supabase delta-sync upsert.
  - All Playwright locator operations use .all() + list comprehension
    rather than .nth() loops to minimise round-trips to the browser process.

Usage:
    export PROXY_URL="http://user:pass@residential.provider.com:8000"
    python main.py

Requirements:
    pip install -r requirements.txt
    playwright install chromium
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import glob
import json
import requests

from datetime import timedelta
from supabase_uploader import upload_to_supabase

# Global to cache live exchange rate to prevent spamming API
LIVE_USD_TO_INR = 83.5

def fetch_live_exchange_rate():
    global LIVE_USD_TO_INR
    try:
        response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=10)
        data = response.json()
        rate = data.get('rates', {}).get('INR')
        if rate:
            LIVE_USD_TO_INR = float(rate)
            logging.getLogger(__name__).info(f"Successfully fetched live USD to INR rate: {LIVE_USD_TO_INR}")
    except Exception as e:
        logging.getLogger(__name__).error(f"Failed to fetch live exchange rate, falling back to 83.5: {e}")

# Fetch it once at module load
fetch_live_exchange_rate()

from crawlee import Glob
from crawlee.browsers import BrowserPool
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext
from crawlee.crawlers._playwright._playwright_pre_nav_crawling_context import (
    PlaywrightPreNavCrawlingContext,
)
from crawlee.storages import RequestQueue

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("certifyd.crawler")


# ---------------------------------------------------------------------------
# Route labels — single source of truth, avoids magic strings
# ---------------------------------------------------------------------------

LABEL_INDEX  = "INDEX"
LABEL_DETAIL = "DETAIL"
LABEL_AWS_INDEX = "AWS_INDEX"
LABEL_AWS_DETAIL = "AWS_DETAIL"
LABEL_GC_INDEX = "GC_INDEX"
LABEL_GC_DETAIL = "GC_DETAIL"
LABEL_CISCO_INDEX = "CISCO_INDEX"
LABEL_CISCO_DETAIL = "CISCO_DETAIL"
LABEL_COMPTIA_INDEX = "COMPTIA_INDEX"
LABEL_COMPTIA_DETAIL = "COMPTIA_DETAIL"
LABEL_OFFSEC_INDEX = "OFFSEC_INDEX"
LABEL_OFFSEC_DETAIL = "OFFSEC_DETAIL"
LABEL_LPI_INDEX = "LPI_INDEX"
LABEL_LPI_DETAIL = "LPI_DETAIL"


# ---------------------------------------------------------------------------
# Seed URLs
# ---------------------------------------------------------------------------

# The credentials browse page is the canonical entry point.
# It renders a filterable grid of all MS certifications via client-side JS.
# The INDEX handler waits for hydration and then harvests the rendered links.
SEED_URLS: list[dict] = [
    {"url": "https://learn.microsoft.com/en-us/credentials/browse/?credential_types=certification", "label": LABEL_INDEX},
    {"url": "https://aws.amazon.com/certification/", "label": LABEL_AWS_INDEX},
    {"url": "https://cloud.google.com/learn/certification", "label": LABEL_GC_INDEX},
    {"url": "https://www.cisco.com/site/us/en/learn/training-certifications/certifications.html", "label": LABEL_CISCO_INDEX},
    {"url": "https://www.comptia.org/certifications", "label": LABEL_COMPTIA_INDEX},
    {"url": "https://www.offsec.com/courses-and-certifications/", "label": LABEL_OFFSEC_INDEX},
    {"url": "https://www.lpi.org/our-certifications/", "label": LABEL_LPI_INDEX},
]


# ---------------------------------------------------------------------------
# Network interception — block lists (carried over from Phase 2)
# ---------------------------------------------------------------------------

_STATIC_ASSET_PATTERNS: list[str] = [
    ".css", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico",
    ".svg", ".woff", ".woff2", ".ttf", ".eot",
    ".mp4", ".webm", ".mp3",
    ".zip", ".pdf",
]

_TRACKING_PATTERNS: list[str] = [
    "google-analytics", "googletagmanager", "googletagservices",
    "googlesyndication", "doubleclick", "adservice.google",
    "amazon-adsystem", "ads.linkedin",
    "facebook.com/tr", "connect.facebook.net",
    "platform.twitter.com", "static.ads-twitter", "snap.licdn",
    "hotjar", "clarity.ms", "fullstory", "logrocket", "mouseflow",
    "cookielaw.org", "onetrust", "cookiepro",
    "widget.intercom.io", "js.hs-scripts", "js.hsforms",
    "bat.bing.com", "sc.omtrdc.net", "assets.adobedtm.com",
]


# ---------------------------------------------------------------------------
# Proxy helper (carried over from Phase 2)
# ---------------------------------------------------------------------------

def _build_proxy_config() -> dict | None:
    proxy_url = os.environ.get("PROXY_URL", "")
    if not proxy_url:
        logger.warning("PROXY_URL not set — running without proxy.")
        return None
    return {"server": proxy_url}


# ---------------------------------------------------------------------------
# Locator helpers — all selectors grounded in live DOM audit
# ---------------------------------------------------------------------------

async def _extract_text_list(context: PlaywrightCrawlingContext, css: str) -> list[str]:
    """Return stripped inner-text for every element matching css, skipping blanks."""
    nodes = await context.page.locator(css).all()
    results: list[str] = []
    for node in nodes:
        try:
            text = (await node.inner_text()).strip()
            if text:
                results.append(text)
        except Exception:
            pass
    return results


async def _extract_section_paragraphs(
    context: PlaywrightCrawlingContext,
    heading_text: str,
) -> list[str]:
    """
    Extract <p> text from the section whose nearest preceding <h2> or <h3>
    contains heading_text.  Uses JS evaluation for reliable sibling traversal.

    MS Learn renders the page as a single #main div with alternating heading +
    prose blocks.  There is no wrapping <section> element — siblings must be
    walked manually.
    """
    script = """
    (headingText) => {
        const headings = [...document.querySelectorAll('h2, h3')];
        const target = headings.find(h => h.innerText.trim().includes(headingText));
        if (!target) return [];
        
        // If it's inside a dedicated section container, just grab all text
        if (target.parentElement && target.parentElement.tagName === 'SECTION') {
            return [...target.parentElement.querySelectorAll('p, li')].map(e => e.innerText.trim()).filter(Boolean);
        }
        
        // Fallback: sibling walk (like before)
        const paragraphs = [];
        let sibling = target.nextElementSibling;
        while (sibling && !['H2','H3'].includes(sibling.tagName)) {
            if (sibling.tagName === 'P') {
                const t = sibling.innerText.trim();
                if (t) paragraphs.push(t);
            }
            if (sibling.tagName === 'UL' || sibling.tagName === 'DIV') {
                sibling.querySelectorAll('p, li').forEach(el => {
                    const t = el.innerText.trim();
                    if (t) paragraphs.push(t);
                });
            }
            sibling = sibling.nextElementSibling;
        }
        return paragraphs;
    }
    """
    try:
        result = await context.page.evaluate(script, heading_text)
        return [str(s) for s in result if s]
    except Exception as exc:
        logger.debug("_extract_section_paragraphs('%s') failed: %s", heading_text, exc)
        return []


async def _extract_skills(context: PlaywrightCrawlingContext) -> list[str]:
    """
    Extract the "Assessed on this exam" bullet list from a detail page.
    """
    script = """
    () => {
        const els = [...document.querySelectorAll('p, h2, h3')];
        const target = els.find(e => e.innerText.includes('Assessed on this exam') || e.innerText.includes('Skills measured'));
        if (!target) return [];
        
        let sibling = target.nextElementSibling;
        while (sibling && !['H2','H3'].includes(sibling.tagName)) {
            if (sibling.tagName === 'UL') {
                return [...sibling.querySelectorAll('li')].map(li => li.innerText.trim()).filter(Boolean);
            }
            if (sibling.tagName === 'DIV') {
                const ul = sibling.querySelector('ul');
                if (ul) return [...ul.querySelectorAll('li')].map(li => li.innerText.trim()).filter(Boolean);
            }
            sibling = sibling.nextElementSibling;
        }
        
        const ul = target.parentElement.querySelector('ul');
        if (ul) return [...ul.querySelectorAll('li')].map(li => li.innerText.trim()).filter(Boolean);
        return [];
    }
    """
    try:
        result = await context.page.evaluate(script)
        return [str(s) for s in result if s]
    except Exception as exc:
        logger.debug("_extract_skills() failed: %s", exc)
        return []


async def _extract_cost(context: PlaywrightCrawlingContext) -> str:
    """Extract certification exam cost/price."""
    try:
        await context.page.wait_for_selector('.exam-amount', timeout=3000)
    except Exception:
        pass
        
    script = """
    () => {
        const el = document.querySelector('.exam-amount');
        return el ? el.innerText.trim() : "";
    }
    """
    try:
        cost = await context.page.evaluate(script)
        if cost:
            return str(cost).strip()
    except Exception:
        pass
    return ""


async def _extract_eligibility(context: PlaywrightCrawlingContext) -> str:
    """Extract Target Audience / Eligibility description."""
    script = """
    () => {
        // 1. Look for explicit headers
        const headings = [...document.querySelectorAll('h2, h3')];
        const h = headings.find(e => /Who should|Audience|Candidate/i.test(e.innerText));
        if (h) {
            if (h.parentElement && h.parentElement.tagName === 'SECTION') {
                 return [...h.parentElement.querySelectorAll('p, li')].map(p => p.innerText.trim()).join(' ');
            }
            let sibling = h.nextElementSibling;
            let text = [];
            while (sibling && !['H2','H3'].includes(sibling.tagName)) {
                if (sibling.tagName === 'P') text.push(sibling.innerText.trim());
                if (sibling.tagName === 'DIV' || sibling.tagName === 'UL') {
                     text.push(...[...sibling.querySelectorAll('p, li')].map(p => p.innerText.trim()));
                }
                sibling = sibling.nextElementSibling;
            }
            return text.filter(Boolean).join(' ');
        }
        
        // 2. Fallback: Search the Overview section specifically for candidate paragraphs
        const overviewH2 = headings.find(e => e.innerText.includes('Overview'));
        if (overviewH2 && overviewH2.parentElement) {
            const els = [...overviewH2.parentElement.querySelectorAll('p, li')];
            const startIndex = els.findIndex(p => /candidate|audience|who should/i.test(p.innerText));
            if (startIndex !== -1) {
                return els.slice(startIndex).map(p => p.innerText.trim()).join(' ');
            }
        }
        
        // 3. Global fallback
        const els = [...document.querySelectorAll('p, li')];
        const startIndex = els.findIndex(p => /candidate|audience|who should/i.test(p.innerText));
        if (startIndex !== -1) {
            return els.slice(startIndex, startIndex + 5).map(p => p.innerText.trim()).join(' ');
        }
        
        return "";
    }
    """
    try:
        eligibility = await context.page.evaluate(script)
        if eligibility:
            return str(eligibility).strip()
    except Exception:
        pass
    return ""


async def _extract_exam_code(context: PlaywrightCrawlingContext) -> str:
    """
    Parse the exam code (e.g. 'AZ-104') from the page.

    DOM audit finding: exam codes appear in heading text like 'Exam AZ-104'
    and also in the URL of the schedule/study-guide links.  We use a heading
    text search first, then fall back to the page URL itself.
    """
    script = """
    () => {
        const text = document.querySelector('#main')?.innerText || '';
        const match = text.match(/\\bExam\\s+([A-Z]{1,4}-\\d{3,4}[A-Z]?)\\b/);
        return match ? match[1] : '';
    }
    """
    try:
        code = await context.page.evaluate(script)
        if code:
            return str(code).strip()
    except Exception:
        pass
    # Fallback: parse from schedule link href attributes
    try:
        hrefs = await context.page.eval_on_selector_all(
            "a[href*='examUid=exam.']",
            "els => els.map(e => e.href)"
        )
        for href in hrefs:
            m = re.search(r"examUid=exam\.([A-Z]{1,4}-\d{3,4}[A-Z]?)", href)
            if m:
                return m.group(1)
    except Exception:
        pass
    return ""


# ---------------------------------------------------------------------------
# Crawler factory
# ---------------------------------------------------------------------------

async def build_crawler() -> PlaywrightCrawler:
    """
    Construct the Phase 3 crawler with:
      - Network interception pre-navigation hook
      - Stealth fingerprint rotation (Crawlee built-in)
      - Residential proxy (if PROXY_URL is set)
      - Two-route dispatch: INDEX → enqueue detail URLs
                            DETAIL → extract + persist data
    """
    queue = await RequestQueue.open()

    proxy_config = _build_proxy_config()
    browser_new_context_options: dict = {
        "locale": "en-US",
        "timezone_id": "Asia/Kolkata",
    }
    if proxy_config:
        browser_new_context_options["proxy"] = proxy_config

    browser_pool = BrowserPool.with_default_plugin(
        browser_type="chromium",
        headless=True,
        use_incognito_pages=True,
        browser_new_context_options=browser_new_context_options,
        browser_launch_options={
            "args": [
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        },
    )

    crawler = PlaywrightCrawler(
        browser_pool=browser_pool,
        max_requests_per_crawl=None,          # Raise to None for a full production run.
        max_request_retries=3,    # Detail pages have heavier JS payloads.
    )

    # -----------------------------------------------------------------------
    # Pre-navigation hook — network interception (Phase 2, preserved)
    # -----------------------------------------------------------------------

    @crawler.pre_navigation_hook
    async def install_network_blocklist(context: PlaywrightPreNavCrawlingContext) -> None:
        await context.block_requests(
            url_patterns=_STATIC_ASSET_PATTERNS,
            extra_url_patterns=_TRACKING_PATTERNS,
        )

    # -----------------------------------------------------------------------
    # Route: INDEX — harvest detail page URLs and enqueue them
    # -----------------------------------------------------------------------

    @crawler.router.handler(label=LABEL_INDEX)
    async def index_handler(context: PlaywrightCrawlingContext) -> None:
        """
        Enqueue all certification detail page URLs found on the browse page.

        Why not use enqueue_links() with a CSS selector directly?
        ──────────────────────────────────────────────────────────
        The MS Learn browse page renders its certification card grid entirely
        via client-side React.  The static HTML Playwright receives before JS
        execution contains no <a> tags for individual certifications.  We must:
          1. Wait for the React grid to hydrate (wait_for_selector on a card).
          2. Extract rendered anchor hrefs via evaluate().
          3. Pass the URL list as explicit requests= to enqueue_links(), with
             label=LABEL_DETAIL so the router dispatches them to detail_handler.

        The include= glob filter ensures we only enqueue true certification
        detail pages (URL pattern: /credentials/certifications/<slug>/) and
        exclude renewal sub-pages (/renew/) and practice-assessment sub-pages.
        """
        logger.info("INDEX handler: %s", context.request.url)

        # Wait for at least one rendered card to confirm hydration.
        # MS Learn uses a custom web component or a div grid — we wait for
        # any anchor whose href matches the known certification URL pattern.
        try:
            await context.page.wait_for_selector(
                "a[href*='/credentials/certifications/']",
                timeout=20_000,
            )
        except Exception:
            logger.warning(
                "No certification links appeared within 20 s on %s — "
                "the page may require JavaScript execution or authentication.",
                context.request.url,
            )

        # Extract all rendered certification detail page hrefs.
        # We use evaluate() rather than enqueue_links(selector=) because the
        # latter calls document.querySelectorAll before React hydration is
        # guaranteed to be complete for all cards.
        raw_hrefs: list[str] = await context.page.evaluate(
            """
            () => [...new Set(
                [...document.querySelectorAll('a[href]')]
                    .map(a => a.href)
                    .filter(h =>
                        h.includes('/credentials/certifications/') &&
                        !h.includes('/renew') &&
                        !h.includes('/practice/') &&
                        !h.includes('/resources/')
                    )
            )]
            """
        )

        logger.info("INDEX: discovered %d candidate detail URLs.", len(raw_hrefs))

        if not raw_hrefs:
            logger.warning(
                "Zero certification URLs extracted from %s.  "
                "The page structure may have changed or JS did not hydrate.",
                context.request.url,
            )
            return

        # Enqueue as explicit requests with DETAIL label.
        # include= / exclude= globs provide a second-pass URL validation layer
        # independent of the JS evaluation above.
        from crawlee import Request
        request_objs = [Request.from_url(url, label=LABEL_DETAIL) for url in raw_hrefs]

        await context.enqueue_links(
            requests=request_objs,
            include=[Glob("https://learn.microsoft.com/*/credentials/certifications/*/")],
            exclude=[
                Glob("*/renew/*"),
                Glob("*/practice/*"),
                Glob("*/resources/*"),
                Glob("*/study-guides/*"),
            ],
        )
    # -----------------------------------------------------------------------
    # Route: DETAIL — extract certification data and persist to dataset

    def clean_ui_noise(text: str) -> str:
        """Removes common UI artifacts and leftover button text from MS Learn."""
        noise_patterns = [
            r"Loading\.\.\.",
            r"Note The bullets that follow.*",
            r"EXAM SANDBOX.*",
            r"Experience demo.*",
            r"Launch the sandbox.*",
            r"Learn more\.",
            r"You will no longer be able to earn or renew.*"
        ]
        
        clean_text = text
        for pattern in noise_patterns:
            clean_text = re.sub(pattern, "", clean_text, flags=re.IGNORECASE)
            
        return " ".join(clean_text.split())

    async def _extract_metadata(context: PlaywrightCrawlingContext) -> dict:
        script = """
        () => {
            const getMetaList = (labelRegex) => {
                const labels = [...document.querySelectorAll('p.list-label')];
                const target = labels.find(p => p.innerText && p.innerText.match(labelRegex));
                if (target && target.nextElementSibling && target.nextElementSibling.classList.contains('list-container')) {
                    return [...target.nextElementSibling.querySelectorAll('a, span, p')].map(e => e.innerText.trim()).filter(Boolean);
                }
                return [];
            }
            
            const banners = [...document.querySelectorAll('.is-warning, .warning, [class*="warning"]')];
            const retireBanner = banners.map(b => b.innerText.trim()).find(t => /retir/i.test(t));
            
            return {
                level: getMetaList(/^Level/i)[0] || "",
                job_roles: getMetaList(/^Role/i),
                languages: getMetaList(/^Language/i),
                retire_banner: retireBanner || null
            }
        }
        """
        try:
            return await context.page.evaluate(script)
        except Exception:
            return {"level": "", "job_roles": [], "languages": [], "retire_banner": None}
    # -----------------------------------------------------------------------
    # Route: DETAIL — extract certification data and persist to dataset
    # -----------------------------------------------------------------------

    @crawler.router.handler(label=LABEL_DETAIL)
    async def detail_handler(context: PlaywrightCrawlingContext) -> None:
        """
        Extract structured certification data from an individual detail page
        and write it to the Crawlee default dataset.

        Extraction strategy (grounded in live DOM audit):
          ┌──────────────────┬──────────────────────────────────────────┐
          │ Field            │ Extraction method                        │
          ├──────────────────┼──────────────────────────────────────────┤
          │ title            │ h1 inner_text()                          │
          │ tagline          │ og:description meta content attribute    │
          │ overview         │ JS sibling-walk from "Overview" h2       │
          │ skills_measured  │ JS walk from "Assessed on this exam" h3  │
          │ prerequisites    │ JS sibling-walk from "Prerequisites" h2  │
          │ exam_code        │ JS regex on page text + href fallback    │
          │ source_url       │ context.request.url (identity field)     │
          └──────────────────┴──────────────────────────────────────────┘

        All extractions are wrapped in defensive try/except so that a single
        missing element never aborts the full record — the field will be an
        empty string or empty list instead.

        push_data() output:
          Crawlee writes ./storage/datasets/default/<uuid>.json per call.
          One JSON file = one certification record.  Phase 4 will layer a
          Supabase upsert on top of (or in place of) this call.
        """
        url = context.request.url
        
        if "/en-us/" in url:
            url = url.replace("/en-us/", "/en-in/")
            logger.info("Forcing INR pricing locale: %s", url)
            await context.page.goto(url, wait_until="domcontentloaded")
            
        logger.info("DETAIL handler: %s", url)

        # Wait for the main content block to confirm the page is rendered.
        try:
            await context.page.wait_for_selector("#main h1", timeout=20_000)
        except Exception:
            logger.warning("h1 not found within 20 s on %s — skipping.", url)
            return

        # ── 1. Certification title ─────────────────────────────────────────
        title = ""
        try:
            title = (await context.page.locator("#main h1").first.inner_text()).strip()
        except Exception as exc:
            logger.debug("title extraction failed on %s: %s", url, exc)

        # ── 2. Tagline (og:description meta) ──────────────────────────────
        tagline = ""
        try:
            tagline = await context.page.get_attribute(
                'meta[property="og:description"]', "content"
            ) or ""
            tagline = tagline.strip()
        except Exception as exc:
            logger.debug("tagline extraction failed on %s: %s", url, exc)

        # ── 3. Overview / description paragraphs ──────────────────────────
        overview_paragraphs = await _extract_section_paragraphs(context, "Overview")
        # Fallback: if "Overview" heading absent, grab the first prose block.
        if not overview_paragraphs:
            try:
                overview_paragraphs = await _extract_text_list(
                    context, "#main > div > p, #main p"
                )
                overview_paragraphs = overview_paragraphs[:6]  # cap to intro block
            except Exception:
                pass

        raw_overview = " ".join(overview_paragraphs)
        clean_overview = clean_ui_noise(raw_overview)

        # ── 4. Skills measured ────────────────────────────────────────────
        skills_measured = await _extract_skills(context)

        # ── 5. Prerequisites ──────────────────────────────────────────────
        # Prerequisites appear under an "## Prerequisites" h2 on certifications
        # that require a prior cert (e.g. Expert-level certs).  Many certs
        # have no formal prerequisites — returns [] in that case.
        prerequisites = await _extract_section_paragraphs(context, "Prerequisites")
        # Some pages call it "Required certifications" or "Before you begin"
        if not prerequisites:
            prerequisites = await _extract_section_paragraphs(context, "Required")

        # ── 6. Exam code ──────────────────────────────────────────────────
        exam_code = await _extract_exam_code(context)

        # ── X. Cost / Price ──────────────────────────────────────────────
        cost = await _extract_cost(context)

        # ── Y. Eligibility / Target Audience ─────────────────────────────
        raw_eligibility = await _extract_eligibility(context)
        eligibility = clean_ui_noise(raw_eligibility)

        # ── Z. New Metadata ──────────────────────────────────────────────
        metadata = await _extract_metadata(context)
        retirement_date = None
        if metadata.get("retire_banner"):
            match = re.search(r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})', metadata["retire_banner"], re.IGNORECASE)
            retirement_date = match.group(1) if match else metadata["retire_banner"]

        # ── 7. Assemble record ────────────────────────────────────────────
        cost_str = re.sub(r'[^\d.]', '', str(cost))
        cost_inr = float(cost_str) if cost_str else 0.0
        cost_usd = round(cost_inr / LIVE_USD_TO_INR, 2) if LIVE_USD_TO_INR else 0.0

        record: dict = {
            "source_url":      url,
            "title":           title,
            "tagline":         tagline,
            "overview":        clean_overview,
            "skills_measured": skills_measured,
            "prerequisites":   prerequisites,
            "exam_code":       exam_code,
            "cost_inr":        cost_inr,
            "cost_usd":        cost_usd,
            "eligibility":     eligibility,
            "level":           metadata.get("level", ""),
            "job_roles":       metadata.get("job_roles", []),
            "languages":       metadata.get("languages", []) or ["English"],
            "retirement_date": retirement_date,
        }

        logger.info(
            "DETAIL extracted: title=%r  exam_code=%r  cost_inr=%r  cost_usd=%r skills=%d  prereqs=%d",
            title, exam_code, cost_inr, cost_usd, len(skills_measured), len(prerequisites),
        )

        # ── 8. Persist ────────────────────────────────────────────────────
        # Crawlee auto-creates ./storage/datasets/default/ on first call.
        # Each push_data() call writes one JSON file: <uuid>.json
        await context.push_data(record)

    # -----------------------------------------------------------------------
    # Route: AWS INDEX
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_AWS_INDEX)
    async def aws_index_handler(context: PlaywrightCrawlingContext) -> None:
        logger.info("AWS INDEX handler: %s", context.request.url)
        
        await context.page.wait_for_load_state("domcontentloaded")
        
        raw_hrefs: list[str] = await context.page.evaluate(
            """
            () => [...new Set(
                [...document.querySelectorAll('a[href]')]
                    .map(a => a.href)
                    .filter(h => h.includes('/certification/certified-'))
            )]
            """
        )
        logger.info("AWS INDEX: discovered %d candidate detail URLs.", len(raw_hrefs))
        
        if not raw_hrefs:
            return
            
        from crawlee import Request
        request_objs = [Request.from_url(url if url.startswith('http') else 'https://aws.amazon.com'+url, label=LABEL_AWS_DETAIL) for url in raw_hrefs]
        await context.enqueue_links(requests=request_objs)

    # -----------------------------------------------------------------------
    # Route: AWS DETAIL
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_AWS_DETAIL)
    async def aws_detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        logger.info("AWS DETAIL handler: %s", url)
        
        await context.page.wait_for_load_state("networkidle")
        
        title = ""
        try:
            title = (await context.page.locator("h1").first.inner_text()).strip()
        except Exception:
            pass

        html = await context.page.content()
        import re
        
        cost_match = re.search(r'(\d+)\s*USD', html)
        cost = cost_match.group(1) if cost_match else "0"
        
        level_match = re.search(r'(Foundational|Associate|Professional|Specialty)', html)
        level = level_match.group(1) if level_match else "Unknown"
        
        code_match = re.search(r'([A-Z]{3}-C\d{2})', html)
        exam_code = code_match.group(1) if code_match else f"PENDING-{url.split('/')[-2] if url.endswith('/') else url.split('/')[-1]}"
        
        paragraphs = await context.page.locator("p").all_inner_texts()
        meaningful_p = [p.strip() for p in paragraphs if len(p.strip()) > 60 and 'cookie' not in p.lower() and 'privacy' not in p.lower() and 'advertising' not in p.lower() and 'opt out' not in p.lower()]
        
        overview = " ".join(meaningful_p[:3]) if meaningful_p else "See AWS certification page for full details."
        
        # Try to find prerequisites in the text
        prerequisites = []
        if any('experience' in p.lower() or 'background' in p.lower() for p in meaningful_p):
            prereq_text = [p for p in meaningful_p if 'experience' in p.lower() or 'background' in p.lower()]
            prerequisites.append(prereq_text[0])
            
        # Extract Job Roles from Title
        possible_roles = ["Developer", "Architect", "Engineer", "Administrator", "Data Scientist", "Security Analyst", "Practitioner"]
        job_roles = [r for r in possible_roles if r.lower() in title.lower()]
        if not job_roles:
            job_roles = ["Cloud Professional"]

        record: dict = {
            "source_url":      url,
            "title":           title,
            "tagline":         title,
            "overview":        overview,
            "skills_measured": ["Review the official exam guide for a detailed breakdown of skills measured."],
            "prerequisites":   prerequisites,
            "exam_code":       exam_code,
            "cost_usd": float(cost) if str(cost).isdigit() else 0.0,
            "cost_inr": round((float(cost) if str(cost).isdigit() else 0.0) * LIVE_USD_TO_INR, 2),
            "eligibility":     "None stated.",
            "level":           level,
            "job_roles":       job_roles,
            "languages":       ["English"],
            "retirement_date": None,
        }
        
        logger.info("AWS DETAIL extracted: title=%r  exam_code=%r  cost=%r", title, exam_code, cost)
        await context.push_data(record)

    # -----------------------------------------------------------------------
    # Route: GOOGLE CLOUD INDEX
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_GC_INDEX)
    async def gc_index_handler(context: PlaywrightCrawlingContext) -> None:
        logger.info("GC INDEX handler: %s", context.request.url)
        await context.page.wait_for_load_state("networkidle")
        raw_hrefs: list[str] = await context.page.evaluate(
            """
            () => [...new Set(
                [...document.querySelectorAll('a[href]')]
                    .map(a => a.href)
                    .filter(h => h.includes('/learn/certification/') && !h.includes('#'))
            )]
            """
        )
        if not raw_hrefs: return
        from crawlee import Request
        request_objs = [Request.from_url(url, label=LABEL_GC_DETAIL) for url in raw_hrefs]
        await context.enqueue_links(requests=request_objs)

    # -----------------------------------------------------------------------
    # Route: GOOGLE CLOUD DETAIL
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_GC_DETAIL)
    async def gc_detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        logger.info("GC DETAIL handler: %s", url)
        await context.page.wait_for_load_state("networkidle")
        
        try:
            title = (await context.page.locator("h1").first.inner_text()).strip()
        except:
            title = ""
            
        paragraphs = await context.page.locator("p").all_inner_texts()
        meaningful_p = [p.strip() for p in paragraphs if len(p.strip()) > 60 and 'cookie' not in p.lower()]
        overview = " ".join(meaningful_p[:2]) if meaningful_p else "See Google Cloud certification page for full details."
        
        prerequisites = []
        if any('experience' in p.lower() for p in meaningful_p):
            prereq_text = [p for p in meaningful_p if 'experience' in p.lower()]
            prerequisites.append(prereq_text[0])

        html = await context.page.content()
        import re
        cost_match = re.search(r'(?:Registration fee|Cost|Price)[^\$]*\$(\d+)', html, re.IGNORECASE)
        cost = cost_match.group(1) if cost_match else "200"
        
        level = "Professional" if "Professional" in title else "Associate" if "Associate" in title else "Foundational"
        exam_code = f"PENDING-{url.split('/')[-1]}"
        
        possible_roles = ["Developer", "Architect", "Engineer", "Administrator", "Data Scientist", "Security Analyst", "Practitioner"]
        job_roles = [r for r in possible_roles if r.lower() in title.lower()]
        if not job_roles:
            job_roles = ["Cloud Professional"]

        record: dict = {
            "source_url": url, "title": title, "tagline": title, "overview": overview,
            "skills_measured": ["Review the official Google Cloud exam guide for a detailed breakdown of skills measured."], "prerequisites": prerequisites, "exam_code": exam_code,
            "cost_usd": float(cost), "cost_inr": round(float(cost) * LIVE_USD_TO_INR, 2), "eligibility": "None stated.", "level": level, "job_roles": job_roles,
            "languages": ["English"], "retirement_date": None,
        }
        await context.push_data(record)

    # -----------------------------------------------------------------------
    # Route: CISCO INDEX
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_CISCO_INDEX)
    async def cisco_index_handler(context: PlaywrightCrawlingContext) -> None:
        logger.info("CISCO INDEX handler: %s", context.request.url)
        await context.page.wait_for_load_state("networkidle")
        raw_hrefs: list[str] = await context.page.evaluate(
            """
            () => [...new Set(
                [...document.querySelectorAll('a[href]')]
                    .map(a => a.href)
                    .filter(h => h.includes('certifications/') && (h.includes('associate') || h.includes('professional') || h.includes('expert')))
            )]
            """
        )
        if not raw_hrefs: return
        from crawlee import Request
        request_objs = [Request.from_url(url if url.startswith('http') else 'https://www.cisco.com'+url, label=LABEL_CISCO_DETAIL) for url in raw_hrefs]
        await context.enqueue_links(requests=request_objs)

    # -----------------------------------------------------------------------
    # Route: CISCO DETAIL
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_CISCO_DETAIL)
    async def cisco_detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        logger.info("CISCO DETAIL handler: %s", url)
        await context.page.wait_for_load_state("networkidle")
        
        try:
            title = (await context.page.locator("h1").first.inner_text()).strip()
        except:
            title = ""
            
        paragraphs = await context.page.locator("p").all_inner_texts()
        meaningful_p = [p.strip() for p in paragraphs if len(p.strip()) > 60 and 'cookie' not in p.lower() and 'cisco' in p.lower()]
        overview = " ".join(meaningful_p[:2]) if meaningful_p else "See Cisco certification page for full details."
        
        prerequisites = []
        if any('experience' in p.lower() for p in meaningful_p):
            prerequisites.append([p for p in meaningful_p if 'experience' in p.lower()][0])

        html = await context.page.content()
        import re
        cost_match = re.search(r'(?:Registration fee|Cost|Price)[^\$]*\$(\d+)', html, re.IGNORECASE)
        cost = cost_match.group(1) if cost_match else "300"
        
        level = "Professional" if "Professional" in title or "CCNP" in title else "Associate" if "Associate" in title or "CCNA" in title else "Expert"
        code_match = re.search(r'([0-9]{3}-[0-9]{3})', html)
        exam_code = code_match.group(1) if code_match else f"PENDING-{url.split('/')[-2] if url.endswith('/') else url.split('/')[-1]}"

        possible_roles = ["Developer", "Architect", "Engineer", "Administrator", "Data Scientist", "Security Analyst", "Practitioner"]
        job_roles = [r for r in possible_roles if r.lower() in title.lower()]
        if not job_roles:
            job_roles = ["Network Professional"]

        record: dict = {
            "source_url": url, "title": title, "tagline": title, "overview": overview,
            "skills_measured": ["Review the official Cisco exam blueprint for a detailed breakdown of skills measured."], "prerequisites": prerequisites, "exam_code": exam_code,
            "cost_usd": float(cost), "cost_inr": round(float(cost) * LIVE_USD_TO_INR, 2), "eligibility": "None stated.", "level": level, "job_roles": job_roles,
            "languages": ["English"], "retirement_date": None,
        }
        await context.push_data(record)

    # -----------------------------------------------------------------------
    # Route: COMPTIA INDEX
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_COMPTIA_INDEX)
    async def comptia_index_handler(context: PlaywrightCrawlingContext) -> None:
        logger.info("COMPTIA INDEX handler: %s", context.request.url)
        await context.page.wait_for_load_state("networkidle")
        raw_hrefs: list[str] = await context.page.evaluate(
            """
            () => [...new Set(
                [...document.querySelectorAll('a[href]')]
                    .map(a => a.href)
                    .filter(h => h.includes('/certifications/') && !h.includes('#'))
            )]
            """
        )
        if not raw_hrefs: return
        from crawlee import Request
        request_objs = [Request.from_url(url if url.startswith('http') else 'https://www.comptia.org'+url, label=LABEL_COMPTIA_DETAIL) for url in raw_hrefs]
        await context.enqueue_links(requests=request_objs)

    # -----------------------------------------------------------------------
    # Route: COMPTIA DETAIL
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_COMPTIA_DETAIL)
    async def comptia_detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        logger.info("COMPTIA DETAIL handler: %s", url)
        await context.page.wait_for_load_state("networkidle")
        try:
            title = (await context.page.locator("h1").first.inner_text()).strip()
        except:
            title = ""
            
        paragraphs = await context.page.locator("p").all_inner_texts()
        meaningful_p = [p.strip() for p in paragraphs if len(p.strip()) > 60 and 'cookie' not in p.lower()]
        overview = " ".join(meaningful_p[:2]) if meaningful_p else "See CompTIA certification page for full details."
        
        prerequisites = []
        if any('experience' in p.lower() for p in meaningful_p):
            prerequisites.append([p for p in meaningful_p if 'experience' in p.lower()][0])

        html = await context.page.content()
        import re
        cost_match = re.search(r'(?:Registration fee|Cost|Price)[^\$]*\$(\d+)', html, re.IGNORECASE)
        cost = cost_match.group(1) if cost_match else "394"
        
        level = "Professional" if "+" in title and "Security" in title else "Foundational" if "+" in title else "Associate"
        exam_code = f"PENDING-{url.split('/')[-1]}"
        
        possible_roles = ["Developer", "Architect", "Engineer", "Administrator", "Data Scientist", "Security Analyst", "Practitioner"]
        job_roles = [r for r in possible_roles if r.lower() in title.lower()]
        if not job_roles:
            job_roles = ["IT Professional"]

        record: dict = {
            "source_url": url, "title": title, "tagline": title, "overview": overview,
            "skills_measured": ["Review the official CompTIA exam blueprint for a detailed breakdown of skills measured."], "prerequisites": prerequisites, "exam_code": exam_code,
            "cost_usd": float(cost), "cost_inr": round(float(cost) * LIVE_USD_TO_INR, 2), "eligibility": "None stated.", "level": level, "job_roles": job_roles,
            "languages": ["English"], "retirement_date": None,
        }
        await context.push_data(record)

    # -----------------------------------------------------------------------
    # Route: OFFSEC INDEX
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_OFFSEC_INDEX)
    async def offsec_index_handler(context: PlaywrightCrawlingContext) -> None:
        logger.info("OFFSEC INDEX handler: %s", context.request.url)
        await context.page.wait_for_load_state("networkidle")
        raw_hrefs: list[str] = await context.page.evaluate(
            """
            () => [...new Set(
                [...document.querySelectorAll('a[href]')]
                    .map(a => a.href)
                    .filter(h => h.includes('offsec.com') && (h.includes('-certification') || h.includes('-course')))
            )]
            """
        )
        if not raw_hrefs: return
        from crawlee import Request
        request_objs = [Request.from_url(url, label=LABEL_OFFSEC_DETAIL) for url in raw_hrefs]
        await context.enqueue_links(requests=request_objs)

    # -----------------------------------------------------------------------
    # Route: OFFSEC DETAIL
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_OFFSEC_DETAIL)
    async def offsec_detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        logger.info("OFFSEC DETAIL handler: %s", url)
        await context.page.wait_for_load_state("networkidle")
        try:
            title = (await context.page.locator("h1").first.inner_text()).strip()
        except:
            title = ""
            
        paragraphs = await context.page.locator("p").all_inner_texts()
        meaningful_p = [p.strip() for p in paragraphs if len(p.strip()) > 60 and 'cookie' not in p.lower()]
        overview = " ".join(meaningful_p[:2]) if meaningful_p else "See OffSec certification page for full details."
        
        prerequisites = []
        if any('experience' in p.lower() or 'familiarity' in p.lower() for p in meaningful_p):
            prerequisites.append([p for p in meaningful_p if 'experience' in p.lower() or 'familiarity' in p.lower()][0])

        html = await context.page.content()
        import re
        cost_match = re.search(r'(?:Registration fee|Cost|Price)[^\$]*\$(\d+)', html, re.IGNORECASE)
        cost = cost_match.group(1) if cost_match else "1649"
        
        level = "Professional"
        exam_code = f"PENDING-{url.split('/')[-2] if url.endswith('/') else url.split('/')[-1]}"

        possible_roles = ["Developer", "Architect", "Engineer", "Administrator", "Data Scientist", "Security Analyst", "Practitioner", "Penetration Tester"]
        job_roles = [r for r in possible_roles if r.lower() in title.lower()]
        if not job_roles:
            job_roles = ["Security Professional"]

        record: dict = {
            "source_url": url, "title": title, "tagline": title, "overview": overview,
            "skills_measured": ["Review the official OffSec course syllabus for a detailed breakdown of skills measured."], "prerequisites": prerequisites, "exam_code": exam_code,
            "cost_usd": float(cost), "cost_inr": round(float(cost) * LIVE_USD_TO_INR, 2), "eligibility": "None stated.", "level": level, "job_roles": job_roles,
            "languages": ["English"], "retirement_date": None,
        }
        await context.push_data(record)

    # -----------------------------------------------------------------------
    # Route: LPI INDEX
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_LPI_INDEX)
    async def lpi_index_handler(context: PlaywrightCrawlingContext) -> None:
        logger.info("LPI INDEX handler: %s", context.request.url)
        await context.page.wait_for_load_state("networkidle")
        raw_hrefs: list[str] = await context.page.evaluate(
            """
            () => [...new Set(
                [...document.querySelectorAll('a[href]')]
                    .map(a => a.href)
                    .filter(h => h.includes('our-certifications/') && !h.includes('#'))
            )]
            """
        )
        if not raw_hrefs: return
        from crawlee import Request
        request_objs = [Request.from_url(url if url.startswith('http') else 'https://www.lpi.org'+url, label=LABEL_LPI_DETAIL) for url in raw_hrefs]
        await context.enqueue_links(requests=request_objs)

    # -----------------------------------------------------------------------
    # Route: LPI DETAIL
    # -----------------------------------------------------------------------
    @crawler.router.handler(label=LABEL_LPI_DETAIL)
    async def lpi_detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        logger.info("LPI DETAIL handler: %s", url)
        await context.page.wait_for_load_state("networkidle")
        try:
            title = (await context.page.locator("h1").first.inner_text()).strip()
        except:
            title = ""
            
        paragraphs = await context.page.locator("p").all_inner_texts()
        meaningful_p = [p.strip() for p in paragraphs if len(p.strip()) > 60 and 'cookie' not in p.lower()]
        overview = " ".join(meaningful_p[:2]) if meaningful_p else "See LPI certification page for full details."
        
        prerequisites = []
        if any('experience' in p.lower() or 'active lpic' in p.lower() for p in meaningful_p):
            prerequisites.append([p for p in meaningful_p if 'experience' in p.lower() or 'active lpic' in p.lower()][0])

        html = await context.page.content()
        import re
        cost_match = re.search(r'(?:Registration fee|Cost|Price)[^\$]*\$(\d+)', html, re.IGNORECASE)
        cost = cost_match.group(1) if cost_match else "200"
        
        level = "Professional" if "LPIC-2" in title or "LPIC-3" in title else "Foundational" if "Essentials" in title else "Associate"
        exam_code = f"PENDING-{url.split('/')[-2] if url.endswith('/') else url.split('/')[-1]}"

        possible_roles = ["Developer", "Architect", "Engineer", "Administrator", "Data Scientist", "Security Analyst", "Practitioner"]
        job_roles = [r for r in possible_roles if r.lower() in title.lower()]
        if not job_roles:
            job_roles = ["Linux Professional"]

        record: dict = {
            "source_url": url, "title": title, "tagline": title, "overview": overview,
            "skills_measured": ["Review the official LPI exam blueprint for a detailed breakdown of skills measured."], "prerequisites": prerequisites, "exam_code": exam_code,
            "cost_usd": float(cost), "cost_inr": round(float(cost) * LIVE_USD_TO_INR, 2), "eligibility": "None stated.", "level": level, "job_roles": job_roles,
            "languages": ["English"], "retirement_date": None,
        }
        await context.push_data(record)

    return crawler


# ---------------------------------------------------------------------------
# Default handler — catches any URL that arrives without a recognised label
# (should not happen in a well-formed crawl, but prevents silent drops)
# ---------------------------------------------------------------------------

# Note: default_handler must be registered AFTER the crawler object exists.
# We attach it inside build_crawler but declare it here for clarity.
# (Already handled by the structure above; the default route is the fallback.)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main() -> None:
    """
    Seed the queue with the MS Learn certification browse page (labelled INDEX)
    and start the crawl.

    Output:
      ./storage/datasets/default/*.json  — one file per certification scraped.

    Pre-flight:
      □ playwright install chromium
      □ PROXY_URL env var (optional but recommended for production runs)
    """
    logger.info("Certifyd Phase 3 — extraction pipeline starting.")

    crawler = await build_crawler()

    # Seed as explicit Request objects so we can attach the INDEX label.
    # enqueue_links() label= would only apply to links found during crawling;
    # seed URLs must be labelled at the point of injection into the queue.
    from crawlee import Request
    seed_requests = [
        Request.from_url(seed["url"], label=seed["label"]) for seed in SEED_URLS
    ]

    await crawler.run(seed_requests)

    logger.info(
        "Crawl complete.  Records written to ./storage/datasets/default/"
    )

    # -----------------------------------------------------------------------
    # Post-crawl: Read generated datasets and push to Supabase
    # -----------------------------------------------------------------------
    logger.info("Reading extracted records from dataset...")
    dataset_dir = os.path.join("storage", "datasets", "default")
    json_files = glob.glob(os.path.join(dataset_dir, "*.json"))
    
    scraped_data_list = []
    for filepath in json_files:
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                scraped_data_list.append(data)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON {filepath}: {e}")
                
    if scraped_data_list:
        logger.info(f"Loaded {len(scraped_data_list)} records. Initiating Supabase upload...")
        upload_to_supabase(scraped_data_list)
    else:
        logger.warning("No records found to upload to Supabase.")


if __name__ == "__main__":
    asyncio.run(main())