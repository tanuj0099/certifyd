"""
main.py — Phase 2: Industrial-grade stealth crawler for the Certifyd scraping pipeline.

Phase 2 upgrades over the Phase 1 bootstrap:
  1. Network interception  — asset and analytics blocking via pre_navigation_hook +
                             context.block_requests() using Crawlee's CDPSession path
                             on Chromium (zero overhead vs page.route polling).
  2. Stealth fingerprinting — Crawlee 1.7.x ships a built-in DefaultFingerprintGenerator
                               that rotates browser fingerprints (UA, screen res, platform,
                               Accept-Language, WebGL renderer, canvas noise, etc.) on
                               every new browser context.  This is the correct stealth
                               surface for this version — do NOT install playwright-stealth
                               alongside it; the two fingerprint injection strategies
                               conflict and produce detectable inconsistencies.
  3. Proxy configuration    — Residential rotating proxy injected via Playwright's
                               browser_new_context_options["proxy"] dict.  Proxy
                               credentials are read from environment variables so they
                               are never hardcoded in source.

Architecture notes (Principal Architect):
  - All three anti-detection layers are complementary and operate at different OSI
    layers: network-level blocking (CDPSession), TLS/HTTP-header fingerprinting
    (DefaultFingerprintGenerator), and IP-layer identity rotation (proxy).
  - pre_navigation_hook runs BEFORE Page.goto() is called, so the CDPSession block
    list is active for the very first network request the page makes — including
    the document request itself if it triggers sub-resource prefetches.
  - max_requests_per_crawl remains conservative; raise to None in Phase 3 once
    the extraction handler, retry budget, and dead-letter queue are wired up.

Usage:
    # Export proxy credentials before running (never hardcode in source):
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

from crawlee.browsers import BrowserPool
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext
from crawlee.crawlers._playwright._playwright_pre_nav_crawling_context import (
    PlaywrightPreNavCrawlingContext,
)
from crawlee.storages import RequestQueue

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("certifyd.crawler")


# ---------------------------------------------------------------------------
# Seed URLs
# ---------------------------------------------------------------------------

SEED_URLS: list[str] = [
    # Phase-2 primary target — Microsoft Learn credentials catalogue.
    # Append additional vendor roots (AWS Training, GCP Skills Boost,
    # Linux Foundation, Scrum.org …) here as extraction handler matures.
    "https://learn.microsoft.com/en-us/credentials/",
]


# ---------------------------------------------------------------------------
# Network interception: URL block lists
# ---------------------------------------------------------------------------

# ---- Static assets ---------------------------------------------------------
# Crawlee's built-in default already covers:
#   .css .webp .jpg .jpeg .png .svg .gif .woff .pdf .zip
#
# We override url_patterns entirely to add the gaps (.woff2, .ttf) and to
# ensure the full list is explicit and auditable in one place.
# The block_requests() implementation uses CDPSession.Network.setBlockedURLs on
# Chromium — this is evaluated at the network stack level, not via page.route
# polling, so it adds effectively zero per-request overhead.
_STATIC_ASSET_PATTERNS: list[str] = [
    # Stylesheets
    ".css",
    # Raster images
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".ico",
    # Vector / data URIs
    ".svg",
    # Web fonts — all four common formats
    ".woff",
    ".woff2",           # not in Crawlee default; modern browsers prefer this
    ".ttf",             # not in Crawlee default; fallback for older platforms
    ".eot",
    # Video / audio  (certification pages occasionally embed promo clips)
    ".mp4",
    ".webm",
    ".mp3",
    # Compressed archives
    ".zip",
    ".pdf",
]

# ---- Analytics & tracking domains ------------------------------------------
# These are URL substring patterns, not extensions.  CDPSession.setBlockedURLs
# matches anywhere in the request URL, so a substring like "google-analytics"
# will block https://www.google-analytics.com/analytics.js as well as any
# first-party proxy endpoints that contain that string (e.g. /gtag/js?id=...).
_TRACKING_PATTERNS: list[str] = [
    # Google Analytics / Tag Manager
    "google-analytics",
    "googletagmanager",
    "googletagservices",
    "googlesyndication",
    # Ad networks & remarketing
    "doubleclick",
    "adservice.google",
    "amazon-adsystem",
    "ads.linkedin",
    # Social pixels
    "facebook.com/tr",
    "connect.facebook.net",
    "platform.twitter.com",
    "static.ads-twitter",
    "snap.licdn",
    # Session recording / heatmaps (high-bandwidth, zero data value for us)
    "hotjar",
    "clarity.ms",
    "fullstory",
    "logrocket",
    "mouseflow",
    # Consent management banners (block the JS bundle, not the API calls)
    "cookielaw.org",
    "onetrust",
    "cookiepro",
    # Customer support widgets (heavy iframes, irrelevant to cert data)
    "widget.intercom.io",
    "js.hs-scripts",        # HubSpot
    "js.hsforms",           # HubSpot forms
    "bat.bing.com",         # Microsoft Clarity / Bing UET
    "sc.omtrdc.net",        # Adobe Analytics
    "assets.adobedtm.com",  # Adobe Launch
]


# ---------------------------------------------------------------------------
# Proxy configuration
# ---------------------------------------------------------------------------

# ---- Why proxies are essential alongside fingerprint rotation ---------------
#
# Cloudflare's Bot Management (and similar WAFs like Akamai Bot Manager) operate
# at two distinct layers:
#
#   Layer A — TLS / HTTP fingerprint (JA3/JA4 hash, HTTP/2 frame order,
#             Accept-Language entropy, User-Agent consistency).
#             → Defeated by DefaultFingerprintGenerator rotating per-context.
#
#   Layer B — IP-level behavioural analysis (request velocity per /24 subnet,
#             ASN reputation, datacenter IP detection via BGP prefix lookups,
#             temporal ban via CF error 1015 "You have been rate limited").
#             → Requires rotating residential IPs.  No amount of UA/TLS
#               spoofing defeats a hard IP ban.
#
# Residential proxies (vs datacenter) route through real ISP-assigned IPs that
# appear in Cloudflare's "clean" ASN category.  Per-domain IP rotation (rotate
# on every request or every N requests) prevents the velocity fingerprint that
# triggers 1015.
#
# Integration: Playwright accepts a proxy dict on browser.new_context(), which
# means EVERY network request made by that context — including sub-resource
# fetches and XHR — is routed through the proxy.  This is more complete than
# setting a proxy only on the top-level page.goto() call.
#
# Credential hygiene: never hardcode proxy URLs. Read from environment so that
# secrets management (Vault, AWS SSM, GitHub Actions secrets) can rotate them
# without a code change.

def _build_proxy_config() -> dict | None:
    """
    Read proxy credentials from the environment and return a Playwright
    `browser.new_context()` compatible proxy dict.

    Returns None if PROXY_URL is not set — the crawler will run without a
    proxy (acceptable for local development against non-WAF targets).

    Environment variables
    ---------------------
    PROXY_URL   Full proxy URL including scheme, credentials, host, and port.
                Format: http://USERNAME:PASSWORD@HOST:PORT
                Example: http://user123:s3cr3t@residential.brightdata.com:22225

    To use per-session (sticky) vs rotating IPs, consult your proxy provider's
    URL scheme — BrightData uses port 22225 for rotating and 22226 for sticky;
    Oxylabs uses different sub-domain prefixes.  This function is provider-agnostic.
    """
    proxy_url = os.environ.get(
        "PROXY_URL",
        # ------------------------------------------------------------------ #
        # Development placeholder — replace with a real URL or unset the env  #
        # var to run proxy-less during local development.                      #
        # NEVER commit real credentials here.                                  #
        # ------------------------------------------------------------------ #
        "http://user:pass@proxy.provider.com:8000",
    )

    if not proxy_url or proxy_url == "http://user:pass@proxy.provider.com:8000":
        logger.warning(
            "PROXY_URL is not set or is still the placeholder value.  "
            "Running without a proxy — Cloudflare WAF mitigation is disabled."
        )
        return None

    return {"server": proxy_url}


# ---------------------------------------------------------------------------
# Crawler factory
# ---------------------------------------------------------------------------


async def build_crawler() -> PlaywrightCrawler:
    """
    Construct and configure the Phase 2 stealth-enabled PlaywrightCrawler.

    Anti-detection stack (applied in evaluation order):
      1. DefaultFingerprintGenerator  — rotates TLS/HTTP fingerprints per context.
      2. pre_navigation_hook          — CDPSession URL blocklist before first byte.
      3. Residential proxy            — IP-layer identity rotation.

    Returns
    -------
    PlaywrightCrawler
        A fully initialised crawler ready to call `.run()` on.
    """
    # -----------------------------------------------------------------------
    # Persistent request queue
    # -----------------------------------------------------------------------
    queue = await RequestQueue.open()

    # -----------------------------------------------------------------------
    # Proxy configuration
    # -----------------------------------------------------------------------
    proxy_config = _build_proxy_config()
    browser_new_context_options: dict = {}
    if proxy_config:
        # Playwright's browser.new_context() accepts a `proxy` key whose value
        # is a dict with a mandatory "server" key and optional "username" /
        # "password" / "bypass" keys.  When credentials are embedded in the
        # URL string (as they are here), Playwright parses them automatically —
        # no need to split them out into separate fields.
        browser_new_context_options["proxy"] = proxy_config
        logger.info("Proxy configured: %s", proxy_config["server"].split("@")[-1])

    # -----------------------------------------------------------------------
    # Browser pool — stealth fingerprinting
    # -----------------------------------------------------------------------
    # Crawlee 1.7.x ships DefaultFingerprintGenerator which, on each new browser
    # context, injects a coherent set of spoofed browser signals:
    #   • navigator.userAgent / appVersion / platform / vendor
    #   • navigator.hardwareConcurrency / deviceMemory
    #   • screen.width / height / colorDepth
    #   • Accept-Language and Accept-Encoding headers
    #   • WebGL renderer/vendor strings
    #   • Canvas 2D noise injection (defeats canvas fingerprinting)
    #   • AudioContext noise (defeats audio fingerprinting)
    #   • Consistent TLS ClientHello (JA3 / JA4 hash rotation)
    #
    # fingerprint_generator='default' (the PlaywrightCrawler constructor default)
    # activates this automatically.  We build the BrowserPool explicitly here only
    # to thread in browser_new_context_options (proxy).  Do NOT layer playwright-
    # stealth on top of this — the two injection strategies mutate the same DOM
    # properties and produce detectable inconsistencies.
    browser_pool = BrowserPool.with_default_plugin(
        browser_type="chromium",
        headless=True,                  # Set False for local visual debugging.
        use_incognito_pages=True,       # Each page gets its own context → each
                                        # page gets a freshly rotated fingerprint.
        browser_new_context_options=browser_new_context_options,
        browser_launch_options={
            # Disable Chromium's automation-detection flags.
            # --disable-blink-features=AutomationControlled removes the
            # navigator.webdriver=true property that naive WAFs check first.
            "args": [
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",      # Stability in low-memory envs
                "--no-sandbox",                 # Required in containerised CI
                "--disable-setuid-sandbox",
            ],
        },
    )

    # -----------------------------------------------------------------------
    # Crawler initialisation
    # -----------------------------------------------------------------------
    crawler = PlaywrightCrawler(
        browser_pool=browser_pool,
        # ------------------------------------------------------------------ #
        # Concurrency / politeness                                            #
        # ------------------------------------------------------------------ #
        max_requests_per_crawl=10,          # Conservative; raise in Phase 3.
        max_request_retries=3,              # Retry transient 5xx / network err.
        request_handler_timeout_secs=60,    # Hard per-page timeout.
        # ------------------------------------------------------------------ #
        # Navigation                                                          #
        # ------------------------------------------------------------------ #
        navigation_timeout=30_000,          # ms; fail fast on stalled pages.
        # ------------------------------------------------------------------ #
        # Storage                                                             #
        # ------------------------------------------------------------------ #
        request_provider=queue,
    )

    # -----------------------------------------------------------------------
    # Pre-navigation hook — network interception
    # -----------------------------------------------------------------------
    # pre_navigation_hook runs AFTER a new Playwright Page is created but
    # BEFORE Page.goto() is called.  This is the correct registration point:
    # the CDPSession block list is installed while the page is at about:blank,
    # so it is active for the very first outbound request.
    #
    # context.block_requests() implementation detail (Crawlee source):
    #   On Chromium → opens a CDP session and calls Network.setBlockedURLs.
    #     This operates at the network stack level (pre-socket), not via
    #     page.route event handlers.  Overhead is negligible.
    #   On Firefox/WebKit → falls back to page.route() with extension globs.
    #
    # API: block_requests(
    #         url_patterns=None,           # If None, uses Crawlee's own defaults.
    #         extra_url_patterns=None,     # Appended to url_patterns.
    #      )
    # We pass url_patterns= explicitly to own the full list rather than
    # inheriting defaults we cannot see at a glance; then extra_url_patterns=
    # for the analytics/tracking substrings which are a different match class.

    @crawler.pre_navigation_hook
    async def install_network_blocklist(context: PlaywrightPreNavCrawlingContext) -> None:
        """
        Install the CDPSession URL blocklist before the page navigates.

        Two-tier strategy:
          Tier 1 — Static asset extensions (.css, images, fonts, video):
                   Blocked via url_patterns (extension suffix matching).
                   Reduces per-page payload by ~60–80% on typical cert pages.

          Tier 2 — Analytics / tracking URL substrings:
                   Blocked via extra_url_patterns (substring matching anywhere
                   in the URL).  Eliminates third-party beacons that add
                   latency and expose crawl activity to analytics providers.
        """
        await context.block_requests(
            url_patterns=_STATIC_ASSET_PATTERNS,
            extra_url_patterns=_TRACKING_PATTERNS,
        )
        logger.debug(
            "Network blocklist installed for %s — "
            "%d asset patterns, %d tracking patterns.",
            context.request.url,
            len(_STATIC_ASSET_PATTERNS),
            len(_TRACKING_PATTERNS),
        )

    # -----------------------------------------------------------------------
    # Default request handler (Phase 2 stub — extraction wired in Phase 3)
    # -----------------------------------------------------------------------

    @crawler.router.default_handler
    async def default_handler(context: PlaywrightCrawlingContext) -> None:
        """
        Phase-2 stub handler — confirms stealth stack is operational.

        Phase-3 replacement will:
          1. Extract visible text via context.page.inner_text("body").
          2. Pass it to the Instructor + Groq structured-extraction layer.
          3. Validate the response against ProfessionalCertification (models.py).
          4. Upsert the validated record to Supabase via Delta Sync.
          5. Enqueue discovered certification sub-pages via context.enqueue_links().
        """
        page_title: str = await context.page.title()
        current_url: str = context.request.url

        logger.info("✓ Crawled  | URL   : %s", current_url)
        logger.info("           | Title : %s", page_title)

        # Verify stealth signals are in place.
        webdriver_flag: bool = await context.page.evaluate("() => navigator.webdriver")
        ua_string: str = await context.page.evaluate("() => navigator.userAgent")

        logger.info(
            "           | Stealth check — navigator.webdriver=%s | UA=%s",
            webdriver_flag,
            ua_string[:80],
        )

        if webdriver_flag:
            logger.warning(
                "navigator.webdriver is still True — the --disable-blink-features "
                "flag may not have taken effect.  Check browser_launch_options."
            )

        # ------------------------------------------------------------------
        # TODO (Phase 3): Replace stub above with:
        #
        #   text = await context.page.inner_text("body")
        #   certification = await extract_certification(text, current_url)
        #   await upsert_to_supabase(certification)
        #   await context.enqueue_links()
        # ------------------------------------------------------------------

    return crawler


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def main() -> None:
    """
    Bootstrap entry point for the Phase 2 stealth crawler.

    Pre-flight checklist:
      □ PROXY_URL env var set to a valid residential rotating proxy endpoint.
      □ `playwright install chromium` has been run post pip-install.
      □ Supabase credentials are in .env (used in Phase 3 upsert layer).
    """
    logger.info("Certifyd scraping pipeline — Phase 2 stealth crawler starting.")
    logger.info("Seed URLs: %s", SEED_URLS)

    crawler = await build_crawler()
    await crawler.run(SEED_URLS)

    logger.info("Crawl complete.  Inspect ./storage/ for persisted queue state.")


if __name__ == "__main__":
    asyncio.run(main())
