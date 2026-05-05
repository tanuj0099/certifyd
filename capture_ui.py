"""
CertifyROI Interactive UI Auditor — v4
=======================================
Built from actual source code (DynamicIslandNav.jsx).

KEY FIXES FROM v3:
  1. THEME TOGGLE  — targets the actual ThemeToggle button using its
                     color swatch dot + mono text structure from JSX.
                     Uses cycleTheme() which cycles: dawn→pale→nordic→midnight→ash
  2. TIMING        — much longer waits. Framer Motion animations take
                     300-600ms. We wait AFTER them.
  3. PAGE MANIFEST — built from MARKETING_NAV_ITEMS + APP_NAV_ITEMS
                     plus every tool page you have.
  4. GATE BYPASS   — injects localStorage keys BEFORE React mounts
                     via route interception (v3 approach kept, extended).
  5. SCREENSHOTS   — full-page, waits for nav pill to be visible first.

5 THEMES (in cycle order from useTheme hook):
  dawn → pale → nordic → midnight → ash

Nav pill location: fixed, top:14px, left:50%, transform:translateX(-50%)
Theme toggle:      inline button inside pill, contains 8px dot + mono label
"""

import os
import re
import sys
import json
import time
import shutil
import argparse
import traceback
from datetime import date
from dataclasses import dataclass, field
from typing import Optional, Callable
from playwright.sync_api import sync_playwright, Page, BrowserContext, Route

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────

BASE_URL    = "http://localhost:5173"   # change if your port differs
OUTPUT_ROOT = "ui_review"

# How long to wait after page content appears (ms)
# Framer Motion spring animations need ~600ms to complete
SETTLE_DEFAULT = 3500
SETTLE_TOOL    = 5000   # charts/maps/data-viz need longer
SETTLE_THEME   = 1200   # after clicking theme toggle

# The nav pill is the most reliable "app is ready" indicator.
# It's a fixed div at top:14px — we wait for it to be visible.
# From JSX: it's a motion.div inside a fixed div with no class names.
# Best selector: wait for any nav link text to appear.
NAV_READY_SELECTOR = "a"   # nav links are <a> tags — present once React mounts

# ─────────────────────────────────────────────────────────────────────────────
# 5 THEMES — cycle order matches useTheme hook
# bg_hex used for color verification
# ─────────────────────────────────────────────────────────────────────────────

THEMES = {
    "dawn": {
        "label":   "Dawn",
        "bg_hex":  "#FAF8F5",   # warm off-white — update if different
        "is_light": True,
    },
    "pale": {
        "label":   "Pale",
        "bg_hex":  "#F5F5F5",   # cool light grey — update if different
        "is_light": True,
    },
    "nordic": {
        "label":   "Nordic",
        "bg_hex":  "#222326",   # confirmed dark
        "is_light": False,
    },
    "midnight": {
        "label":   "Midnight",
        "bg_hex":  "#0D0F14",   # deep navy/black — update if different
        "is_light": False,
    },
    "ash": {
        "label":   "Ash",
        "bg_hex":  "#F0EDE8",   # warm ash — update if different
        "is_light": True,
    },
}

# Must match the exact cycle order in your useTheme hook
THEME_CYCLE = ["dawn", "pale", "nordic", "midnight", "ash"]

VIEWPORTS = [
    {"id": "desktop", "width": 1440, "height": 900},
    {"id": "mobile",  "width": 375,  "height": 812},
]

# ─────────────────────────────────────────────────────────────────────────────
# PAGE MANIFEST
# Built from MARKETING_NAV_ITEMS + APP_NAV_ITEMS + all tool pages
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PageDef:
    id:             str
    label:          str
    path:           str                    # URL hash fragment or route path
    settle_ms:      int  = SETTLE_DEFAULT
    ready_selector: str  = ""
    scroll_to:      int  = 0              # px to scroll before screenshot
    scenarios:      list = field(default_factory=list)  # extra named states


# Marketing pages (from MARKETING_NAV_ITEMS)
MARKETING_PAGES = [
    PageDef("home",         "Home",          "/",             settle_ms=4000,
            ready_selector="a"),
    PageDef("tools",        "Tools",         "/#app",         settle_ms=SETTLE_TOOL),
    PageDef("how-it-works", "How It Works",  "/#how-it-works",settle_ms=3000),
    PageDef("pricing",      "Pricing",       "/#pricing",     settle_ms=3000),
    PageDef("about",        "About",         "/#about",       settle_ms=2500),
    PageDef("faq",          "FAQ",           "/#faq",         settle_ms=2500),
]

# App / tool pages — add your actual routes here
TOOL_PAGES = [
    PageDef("dashboard",    "Dashboard",     "/app",          settle_ms=SETTLE_TOOL,
            ready_selector="main, canvas, [class*='chart'], [class*='dashboard']"),

    PageDef("roi-tool",     "ROI Calculator","/roi",          settle_ms=SETTLE_TOOL,
            ready_selector="main, [class*='roi'], [class*='calc']"),

    PageDef("compare",      "Compare Tool",  "/compare",      settle_ms=SETTLE_TOOL,
            ready_selector="main, table, canvas"),

    PageDef("heatmap",      "Heatmap",       "/heatmap",      settle_ms=SETTLE_TOOL,
            ready_selector="main, svg, canvas"),

    PageDef("job-map",      "Job Map",       "/job-map",      settle_ms=SETTLE_TOOL,
            ready_selector="main, svg, canvas"),

    PageDef("simulator",    "Simulator",     "/simulator",    settle_ms=SETTLE_TOOL,
            ready_selector="main, [class*='sim']"),

    PageDef("college",      "College Tool",  "/college",      settle_ms=SETTLE_TOOL,
            ready_selector="main, table, [class*='grid']"),

    PageDef("hike-verify",  "Hike Verifier", "/hike-verifier",settle_ms=SETTLE_TOOL,
            ready_selector="main"),

    PageDef("resume",       "Resume Tool",   "/resume",       settle_ms=SETTLE_TOOL,
            ready_selector="main"),

    PageDef("salary",       "Salary Insights","/salary",      settle_ms=SETTLE_TOOL,
            ready_selector="main, [class*='salary']"),
]

ALL_PAGES = MARKETING_PAGES + TOOL_PAGES


# ─────────────────────────────────────────────────────────────────────────────
# BYPASS — inject state before React mounts
# ─────────────────────────────────────────────────────────────────────────────

BYPASS_STATE = {
    "targetDomain":    "Cybersecurity",
    "hasSelectedMode": True,
    "selectedDomain":  "Cybersecurity",
    "onboardingDone":  True,
    "journeyMode":     "professional",
    "domainSelected":  True,
    "mode":            "professional",
    "domain":          "Cybersecurity",
}
_STATE_JSON = json.dumps(BYPASS_STATE)

# The EXACT Zustand persist key from useJourneyStore.js: 'certify-roi-journey'
BYPASS_SCRIPT = f"""<script>
(function() {{
    // Full Zustand persist payload — matches the shape Zustand expects
    var state = {_STATE_JSON};
    var payload = JSON.stringify({{ state: state, version: 0 }});

    // The confirmed key from useJourneyStore.js
    var PRIMARY_KEY = 'certify-roi-journey';
    try {{ localStorage.setItem(PRIMARY_KEY, payload); }} catch(e) {{}}

    // Also try legacy/alternate key names in case there are other stores
    var fallbackKeys = [
        'journey-store', 'certifyroi-journey', 'certifyroi-store',
        'certifyroi-state', 'app-store', 'user-store', 'goal-store',
        'certify-roi-store', 'certify-roi-state', 'certify-roi-user'
    ];
    fallbackKeys.forEach(function(k) {{
        try {{ localStorage.setItem(k, payload); }} catch(e) {{}}
    }});

    // Flat keys some stores read individually
    var flat = {{
        'targetDomain':    'Cybersecurity',
        'hasSelectedMode': 'true',
        'onboardingDone':  'true',
        'journeyMode':     'professional',
        'selectedDomain':  'Cybersecurity',
        'domainSelected':  'true',
        'mode':            'professional',
        'domain':          'Cybersecurity',
    }};
    Object.keys(flat).forEach(function(k) {{
        try {{ localStorage.setItem(k, flat[k]); }} catch(e) {{}}
        try {{ sessionStorage.setItem(k, flat[k]); }} catch(e) {{}}
    }});
}})();
</script>"""


def install_bypass(page: Page):
    """
    Inject localStorage bypass AFTER page loads but BEFORE React reads state.
    Strategy: use page.add_init_script so it runs on every navigation,
    then also call inject_bypass() explicitly after goto() settles.
    Route interception is avoided — it breaks Vite HMR module loading.
    """
    # add_init_script runs before any page JS on every navigation
    page.add_init_script("""
        (function() {
            var state = {
                targetDomain:    'Cybersecurity',
                hasSelectedMode: true,
                selectedDomain:  'Cybersecurity',
                onboardingDone:  true,
                journeyMode:     'professional',
                domainSelected:  true,
                mode:            'professional',
                domain:          'Cybersecurity',
            };
            var payload = JSON.stringify({ state: state, version: 0 });
            var keys = [
                'certify-roi-journey',
                'journey-store', 'certifyroi-journey', 'certifyroi-store',
                'certify-roi-store', 'app-store'
            ];
            keys.forEach(function(k) {
                try { localStorage.setItem(k, payload); } catch(e) {}
            });
            localStorage.setItem('targetDomain',    'Cybersecurity');
            localStorage.setItem('hasSelectedMode', 'true');
            localStorage.setItem('onboardingDone',  'true');
            localStorage.setItem('journeyMode',     'professional');
        })();
    """)


def inject_bypass(page: Page):
    """
    Call this after page.goto() settles.
    Re-injects localStorage then reloads so React re-reads the values.
    Only reloads if the gate screen is still detected.
    """
    try:
        page.evaluate("""
            () => {
                var state = {
                    targetDomain:    'Cybersecurity',
                    hasSelectedMode: true,
                    selectedDomain:  'Cybersecurity',
                    onboardingDone:  true,
                    journeyMode:     'professional',
                    domainSelected:  true,
                    mode:            'professional',
                    domain:          'Cybersecurity',
                };
                var payload = JSON.stringify({ state: state, version: 0 });
                var keys = [
                    'certify-roi-journey',
                    'journey-store', 'certifyroi-journey',
                    'certify-roi-store', 'app-store'
                ];
                keys.forEach(function(k) {
                    try { localStorage.setItem(k, payload); } catch(e) {}
                });
                localStorage.setItem('targetDomain',    'Cybersecurity');
                localStorage.setItem('hasSelectedMode', 'true');
                localStorage.setItem('onboardingDone',  'true');
                localStorage.setItem('journeyMode',     'professional');
            }
        """)

        # Check if gate is still showing
        gate_visible = page.evaluate("""
            () => {
                const t = (document.body.innerText || '').toLowerCase();
                return ['select your domain','choose your goal',
                        'pick a path','get started','breaking in',
                        'switching careers'].some(k => t.includes(k));
            }
        """)

        if gate_visible:
            _dim("  Gate detected — reloading with bypass active...")
            page.reload(wait_until='domcontentloaded')
            page.wait_for_timeout(3000)

    except Exception as e:
        _dim(f"  inject_bypass error: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────────────────────

G = "\033[92m"; Y = "\033[93m"; R = "\033[91m"; C = "\033[96m"
B = "\033[1m";  D = "\033[2m";  X = "\033[0m"

def _ok(m):   print(f"  {G}✅ {m}{X}")
def _warn(m): print(f"  {Y}⚠️  {m}{X}")
def _err(m):  print(f"  {R}❌ {m}{X}")
def _info(m): print(f"  {C}ℹ  {m}{X}")
def _dim(m):  print(f"  {D}{m}{X}")


# ─────────────────────────────────────────────────────────────────────────────
# COLOUR VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

def _hex_to_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def _parse_rgb(css: str) -> tuple | None:
    m = re.match(r"rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", css)
    return (int(m.group(1)), int(m.group(2)), int(m.group(3))) if m else None

def _rgb_close(a: tuple, b: tuple, tol: int = 12) -> bool:
    """Allow ±12 per channel — handles minor CSS rounding."""
    return all(abs(a[i] - b[i]) <= tol for i in range(3))

def verify_theme_color(page: Page, theme_id: str, label: str) -> bool:
    spec_rgb = _hex_to_rgb(THEMES[theme_id]["bg_hex"])
    try:
        # Check both body and :root background
        computed = page.evaluate("""
            () => {
                const bodyBg = getComputedStyle(document.body).backgroundColor;
                const rootBg = getComputedStyle(document.documentElement).backgroundColor;
                // Return whichever isn't transparent
                return bodyBg !== 'rgba(0, 0, 0, 0)' ? bodyBg : rootBg;
            }
        """)
        actual_rgb = _parse_rgb(computed)
        if actual_rgb is None:
            _warn(f"[COLOR] Could not parse '{computed}' on {label}")
            return False
        if _rgb_close(actual_rgb, spec_rgb):
            actual_hex = "#{:02X}{:02X}{:02X}".format(*actual_rgb)
            _ok(f"[COLOR] {label} ✓ {actual_hex}")
            return True
        actual_hex = "#{:02X}{:02X}{:02X}".format(*actual_rgb)
        _warn(f"[COLOR] MISMATCH {label} — expected {THEMES[theme_id]['bg_hex']} got {actual_hex}")
        return False
    except Exception as e:
        _warn(f"[COLOR] Error on {label}: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# THEME DETECTION
# ─────────────────────────────────────────────────────────────────────────────

def detect_theme(page: Page) -> str:
    """
    Read the current theme from html[data-theme] or body[data-theme].
    Falls back to background color matching.
    """
    try:
        info = page.evaluate("""
            () => ({
                dataTheme: document.documentElement.getAttribute('data-theme')
                        || document.body.getAttribute('data-theme') || '',
                classes:   (document.documentElement.className + ' ' +
                            document.body.className).toLowerCase(),
                bgColor:   getComputedStyle(document.body).backgroundColor,
            })
        """)

        combined = (info.get("dataTheme","") + " " + info.get("classes","")).lower()

        # Check data-theme / class names first
        for tid in THEME_CYCLE:
            if tid in combined:
                return tid

        # Fall back to background color matching
        bg = _parse_rgb(info.get("bgColor",""))
        if bg:
            best_tid, best_dist = "nordic", float("inf")
            for tid, tcfg in THEMES.items():
                spec = _hex_to_rgb(tcfg["bg_hex"])
                dist = sum((bg[i]-spec[i])**2 for i in range(3))
                if dist < best_dist:
                    best_dist = dist
                    best_tid  = tid
            return best_tid

    except Exception:
        pass
    return "nordic"


# ─────────────────────────────────────────────────────────────────────────────
# THEME SWITCHING
#
# The ThemeToggle button in DynamicIslandNav:
#   - Is a <button> with no class or data-testid
#   - Contains an 8px dot div + a <span> with JetBrains Mono text
#   - The span text = current theme name (e.g. "nordic", "ash", "dawn")
#   - Clicking it calls cycleTheme() → next theme in cycle
#
# We click it repeatedly until detect_theme() matches our target.
# ─────────────────────────────────────────────────────────────────────────────

def find_theme_toggle(page: Page):
    """
    Find the ThemeToggle button by its unique structure:
    a button containing a tiny circle div + an uppercase mono-font span.
    We use JS to find it since it has no class or data-testid.
    """
    try:
        # Strategy 1: find button whose text matches a known theme name
        for tid in THEME_CYCLE:
            sel = f"button:has-text('{tid}')"
            try:
                el = page.locator(sel).first
                if el.count() > 0:
                    el.wait_for(state="visible", timeout=3000)
                    _dim(f"Theme toggle found via text '{tid}'")
                    return el
            except Exception:
                continue

        # Strategy 2: find button with an 8px circle child (the color swatch)
        handle = page.evaluate_handle("""
            () => {
                const buttons = [...document.querySelectorAll('button')];
                for (const btn of buttons) {
                    const children = [...btn.children];
                    // Look for a child div that's ~8x8px (the color swatch)
                    for (const child of children) {
                        const s = child.style;
                        if (s && s.width === '8px' && s.height === '8px') {
                            return btn;
                        }
                    }
                }
                return null;
            }
        """)
        if handle:
            element = handle.as_element()
            if element:
                _dim("Theme toggle found via 8px swatch heuristic")
                return page.locator("button").filter(has=page.locator("div[style*='8px']")).first

        # Strategy 3: button inside the nav pill that's not Sign In/Sign Out
        # Nav pill is a fixed div at top:14px — look for buttons inside it
        result = page.evaluate_handle("""
            () => {
                // Find the floating pill (fixed position, top ~14px)
                const fixed = [...document.querySelectorAll('*')].filter(el => {
                    const s = getComputedStyle(el);
                    return s.position === 'fixed' && el.style.top === '14px';
                });
                for (const pill of fixed) {
                    const btns = pill.querySelectorAll('button');
                    for (const btn of btns) {
                        const txt = (btn.textContent || '').trim().toLowerCase();
                        if (['dawn','pale','nordic','midnight','ash'].some(t => txt.includes(t))) {
                            return btn;
                        }
                    }
                }
                return null;
            }
        """)
        if result:
            element = result.as_element()
            if element:
                _dim("Theme toggle found via pill structure")
                return page.locator("button").nth(0)  # approximate

    except Exception as e:
        _warn(f"Theme toggle search error: {e}")

    return None


def cycle_to_theme(page: Page, target: str, base_url: str) -> str:
    """
    Click the theme toggle until we reach the target theme.
    Returns the final detected theme name.
    Max attempts = len(THEME_CYCLE) + 1 to handle any starting position.
    """
    # Reload home to ensure nav is visible
    try:
        page.goto(base_url, wait_until="domcontentloaded", timeout=20_000)
        page.wait_for_timeout(2500)
    except Exception:
        pass

    max_clicks = len(THEME_CYCLE) + 1

    for attempt in range(max_clicks):
        current = detect_theme(page)
        _dim(f"  Theme check {attempt}: current='{current}', target='{target}'")

        if current == target:
            _info(f"Theme '{target}' active ✓")
            return current

        toggle = find_theme_toggle(page)
        if toggle is None:
            _warn(f"Theme toggle not found on attempt {attempt+1}. "
                  f"Add data-testid='theme-toggle' to ThemeToggle button in JSX.")
            break

        try:
            toggle.scroll_into_view_if_needed()
            toggle.click()
            # Wait for Framer Motion animation to complete
            page.wait_for_timeout(SETTLE_THEME)
        except Exception as e:
            _warn(f"  Toggle click failed: {e}")
            break

    final = detect_theme(page)
    if final != target:
        _warn(f"Could not reach '{target}', stuck on '{final}'")
    return final


# ─────────────────────────────────────────────────────────────────────────────
# WAIT STRATEGY — robust, multi-step
# ─────────────────────────────────────────────────────────────────────────────

def wait_ready(page: Page, pg: PageDef):
    """
    4-step wait:
      1. domcontentloaded
      2. Any <a> tag visible (nav pill mounted = React is running)
      3. Page-specific content selector (optional)
      4. Fixed settle time for animations
    """
    # Step 1: DOM parsed
    try:
        page.wait_for_load_state("domcontentloaded", timeout=15_000)
    except Exception:
        pass

    # Step 2: Nav pill ready (React mounted)
    try:
        page.wait_for_selector("a", state="visible", timeout=10_000)
    except Exception:
        _dim("Nav link not found — React may be slow or route doesn't exist")

    # Step 3: Page-specific content
    if pg.ready_selector:
        try:
            page.wait_for_selector(pg.ready_selector, state="visible", timeout=12_000)
            _dim(f"Content ready: {pg.ready_selector}")
        except Exception:
            _warn(f"Content selector '{pg.ready_selector}' not found on {pg.label}")

    # Step 4: Scroll entire page to trigger ALL whileInView animations.
    # Framer Motion only renders sections when they scroll into the viewport.
    # We scroll in steps with pauses, then return to top before screenshot.
    scroll_and_trigger(page)

    # Step 5: Final settle after scroll-back so springs finish
    page.wait_for_timeout(pg.settle_ms)


def scroll_and_trigger(page: Page):
    """
    Scrolls the full page in 400px steps so every Framer Motion
    whileInView / IntersectionObserver fires and renders its content.
    Returns to top so the screenshot starts at the hero section.
    """
    try:
        total_h = page.evaluate("() => document.body.scrollHeight")
        _dim(f"  Scroll-triggering page ({total_h}px)...")

        pos = 0
        while pos < total_h:
            page.evaluate(f"window.scrollTo({{top:{pos},behavior:'instant'}})")
            page.wait_for_timeout(280)
            pos += 400

        # Hit the absolute bottom to catch footer and last sections
        page.evaluate("window.scrollTo({top:document.body.scrollHeight,behavior:'instant'})")
        page.wait_for_timeout(600)

        final_h = page.evaluate("() => document.body.scrollHeight")
        _dim(f"  Done. Final page height: {final_h}px")

        # Return to top so screenshot starts at hero
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        page.wait_for_timeout(400)

    except Exception as e:
        _dim(f"  Scroll error (non-fatal): {e}")


def shoot(page: Page, path: str, label: str) -> bool:
    """Take a full-page screenshot. Scrolls to top first."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    try:
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        page.wait_for_timeout(250)
        page.screenshot(path=path, full_page=True)
        _ok(f"-> {path}")
        return True
    except Exception as e:
        _err(f"Screenshot failed [{label}]: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# AUDIT REPORT
# ─────────────────────────────────────────────────────────────────────────────

class Report:
    def __init__(self, total: int):
        self.total      = total
        self.ok         = 0
        self.failed     = 0
        self.color_ok   = 0
        self.color_fail = 0
        self.color_issues = []
        self.nav_issues   = []

    def shot(self, success: bool):
        if success: self.ok += 1
        else:       self.failed += 1

    def color(self, success: bool, ctx: str):
        if success: self.color_ok += 1
        else:
            self.color_fail += 1
            self.color_issues.append(ctx)

    def nav(self, ctx: str):
        self.nav_issues.append(ctx)

    def summary(self, out_dir: str):
        total_shot = self.ok + self.failed
        print(f"\n{'='*65}")
        print(f"  AUDIT COMPLETE — CertifyROI v4")
        print(f"{'='*65}")
        print(f"  Planned     : {self.total} screenshots")
        print(f"  Captured    : {self.ok} / {total_shot}")
        print(f"  Color spec  : {self.color_ok} pass / {self.color_fail} fail")
        if self.color_issues:
            print(f"\n  {Y}COLOR MISMATCHES (update bg_hex in THEMES dict):{X}")
            for c in self.color_issues:
                print(f"     • {c}")
        if self.nav_issues:
            print(f"\n  {R}NAVIGATION ERRORS (404 or route not found):{X}")
            for n in self.nav_issues:
                print(f"     • {n}")
        all_good = not self.color_issues and not self.nav_issues and self.failed == 0
        if all_good:
            print(f"\n  {G}{B}All checks passed ✓{X}")
        else:
            print(f"\n  {Y}Review the issues above.{X}")
        print(f"\n  Output: ./{out_dir}/")
        print(f"{'='*65}\n")


# ─────────────────────────────────────────────────────────────────────────────
# DIAGNOSE MODE — run first to verify selectors
# ─────────────────────────────────────────────────────────────────────────────

def run_diagnose(base_url: str):
    print(f"\n{'='*65}")
    print(f"  DIAGNOSE — {base_url}")
    print(f"{'='*65}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        ctx     = browser.new_context(viewport={"width": 1440, "height": 900})
        page    = ctx.new_page()
        # NO bypass in diagnose — bypass script may crash React, diagnose raw first
        try:
            print("  Step 1: Loading page...")
            page.goto(base_url, wait_until="domcontentloaded", timeout=20_000)
            print("  Step 2: Waiting 3s for initial render...")
            page.wait_for_timeout(3000)

            # Take a screenshot immediately so you can SEE what loaded
            os.makedirs("diagnose_output", exist_ok=True)
            page.screenshot(path="diagnose_output/raw_load.png", full_page=True)
            print("  ✅ Screenshot saved → diagnose_output/raw_load.png")
            print(f"  Current URL: {page.url}")
            print(f"  Page title:  {page.title()}")

            # Print the raw HTML to see what React actually rendered
            html_snippet = page.evaluate("() => document.body.innerHTML.slice(0, 800)")
            print(f"\n  RAW body HTML (first 800 chars):\n  {html_snippet}\n")

            print("  Step 3: Waiting 5 more seconds for lazy React mount...")
            page.wait_for_timeout(5000)

            # Screenshot after full wait
            page.screenshot(path="diagnose_output/after_wait.png", full_page=True)
            print("  ✅ Screenshot saved → diagnose_output/after_wait.png")

        except Exception as e:
            _err(f"Cannot load {base_url}: {e}")
            browser.close()
            return

        # Dump buttons
        buttons = page.evaluate("""
            () => [...document.querySelectorAll('button')].map(b => ({
                text:    (b.textContent||'').trim().slice(0,60),
                id:      b.id || '',
                classes: b.className || '',
                testid:  b.getAttribute('data-testid') || '',
                style_w: b.style.width || '',
                children_count: b.children.length,
            }))
        """)

        print(f"\n  BUTTONS ({len(buttons)} found):")
        for i, b in enumerate(buttons):
            print(f"  [{i:02d}] text='{b['text'][:40]}' id='{b['id']}' "
                  f"testid='{b['testid']}' classes='{str(b['classes'])[:30]}'")

        # Theme info
        theme_info = page.evaluate("""
            () => ({
                dataTheme: document.documentElement.getAttribute('data-theme') || '(none)',
                bodyBg:    getComputedStyle(document.body).backgroundColor,
                rootBg:    getComputedStyle(document.documentElement).backgroundColor,
                classes:   document.documentElement.className || '(none)',
            })
        """)
        print(f"\n  THEME STATE:")
        print(f"    html[data-theme] : {theme_info['dataTheme']}")
        print(f"    body background  : {theme_info['bodyBg']}")
        print(f"    root background  : {theme_info['rootBg']}")
        print(f"    html classes     : {theme_info['classes']}")

        # Fixed elements (nav pill)
        fixed_els = page.evaluate("""
            () => [...document.querySelectorAll('*')]
                .filter(el => getComputedStyle(el).position === 'fixed')
                .map(el => ({
                    tag:   el.tagName,
                    top:   el.style.top || getComputedStyle(el).top,
                    text:  (el.textContent||'').trim().slice(0,80),
                }))
                .slice(0, 10)
        """)
        print(f"\n  FIXED ELEMENTS (nav pill candidates):")
        for el in fixed_els:
            print(f"    <{el['tag']}> top={el['top']} text='{el['text'][:60]}'")

        print(f"\n{'='*65}")
        input("  Press ENTER to close...")
        browser.close()


# ─────────────────────────────────────────────────────────────────────────────
# MAIN AUDIT LOOP
# ─────────────────────────────────────────────────────────────────────────────

def run_audit(base_url: str, only_theme: str | None, only_device: str | None,
              headful: bool, pages_override: list | None = None):

    today  = date.today().isoformat()
    pages  = pages_override or ALL_PAGES
    themes = [only_theme] if only_theme else THEME_CYCLE
    vps    = [v for v in VIEWPORTS if not only_device or v["id"] == only_device]
    total  = len(themes) * len(vps) * len(pages)
    report = Report(total)

    # Clean previous run
    if os.path.exists(OUTPUT_ROOT):
        shutil.rmtree(OUTPUT_ROOT)

    print(f"\n{'='*65}")
    print(f"  CertifyROI UI Auditor v4")
    print(f"  URL     : {base_url}")
    print(f"  Date    : {today}")
    print(f"  Themes  : {', '.join(themes)}")
    print(f"  Devices : {', '.join(v['id'] for v in vps)}")
    print(f"  Pages   : {len(pages)}")
    print(f"  Total   : {total} screenshots")
    print(f"{'='*65}\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=not headful,
            args=["--disable-blink-features=AutomationControlled"],
        )

        for vp in vps:
            vp_id = vp["id"]
            print(f"\n{'─'*65}")
            print(f"  DEVICE: {vp_id.upper()} ({vp['width']}×{vp['height']})")
            print(f"{'─'*65}")

            ctx = browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                ),
            )
            ctx.add_init_script(f"""
                (function() {{
                    var p = JSON.stringify({{ state: {_STATE_JSON}, version: 0 }});
                    ['journey-store','certifyroi-journey','certifyroi-store',
                     'certifyroi-state','app-store','goal-store'].forEach(function(k) {{
                        try {{ localStorage.setItem(k, p); }} catch(e) {{}}
                    }});
                }})();
            """)

            page = ctx.new_page()
            install_bypass(page)
            # Boot the app once to verify it loads
            try:
                page.goto(base_url, wait_until="domcontentloaded", timeout=25_000)
                page.wait_for_timeout(3000)
                inject_bypass(page)   # post-load: set localStorage + reload if gate visible
                page.wait_for_timeout(2500)
                _ok(f"App loaded on {vp_id}")
            except Exception as e:
                _err(f"Cannot reach {base_url}: {e}")
                _err("Is your dev server running? (npm run dev)")
                ctx.close()
                break
                break

            # ── Theme loop ────────────────────────────────────────────────
            for theme_id in themes:
                theme_label = THEMES[theme_id]["label"]
                print(f"\n  {'━'*50}")
                print(f"  THEME: {theme_label}  ({theme_id})")
                print(f"  {'━'*50}")

                # Switch to this theme
                actual_theme = cycle_to_theme(page, theme_id, base_url)
                if actual_theme != theme_id:
                    _warn(f"Wanted '{theme_id}', got '{actual_theme}' — continuing anyway")

                # ── Page loop ─────────────────────────────────────────────
                for pg in pages:
                    full_url = f"{base_url.rstrip('/')}{pg.path}"
                    print(f"\n    [{pg.id}] {pg.label}")
                    _dim(f"    {full_url}")

                    # Navigate
                    try:
                        page.goto(full_url, wait_until="domcontentloaded", timeout=30_000)
                    except Exception as e:
                        _err(f"    Navigation failed: {e}")
                        report.nav(f"{theme_id}/{vp_id}/{pg.id}")
                        report.shot(False)
                        continue

                    # Inject bypass after each navigation
                    inject_bypass(page)

                    # Wait for content + scroll to trigger animations
                    wait_ready(page, pg)

                    # Color verification
                    ctx_label = f"{theme_id}/{vp_id}/{pg.label}"
                    color_ok  = verify_theme_color(page, theme_id, ctx_label)
                    report.color(color_ok, ctx_label if not color_ok else "")

                    # Screenshot — main state
                    out = os.path.join(OUTPUT_ROOT, today, theme_id, vp_id, f"{pg.id}.png")
                    report.shot(shoot(page, out, pg.label))

                    # Scroll-down screenshot for long pages
                    if pg.scroll_to == 0 and pg.settle_ms >= SETTLE_TOOL:
                        # For tool pages, also capture after scrolling to reveal charts
                        try:
                            page.evaluate("window.scrollTo({top: 600, behavior: 'smooth'})")
                            page.wait_for_timeout(800)
                            out_scroll = os.path.join(
                                OUTPUT_ROOT, today, theme_id, vp_id, f"{pg.id}--scrolled.png"
                            )
                            report.shot(shoot(page, out_scroll, f"{pg.label} (scrolled)"))
                        except Exception:
                            pass

            ctx.close()

        browser.close()

    report.summary(OUTPUT_ROOT)


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="CertifyROI Interactive UI Auditor v4",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python capture_ui.py                          # full run, all themes, headless
  python capture_ui.py --headful                # watch the browser
  python capture_ui.py --headful --theme nordic # one theme only
  python capture_ui.py --headful --device mobile
  python capture_ui.py --diagnose               # print DOM info to tune selectors
  python capture_ui.py --url http://localhost:5174

IMPORTANT — before full run:
  1. Run --diagnose to see your actual button structure
  2. Update THEMES bg_hex values with real colors from your CSS
  3. Add data-testid="theme-toggle" to ThemeToggle button in JSX (one-line fix)
        """,
    )
    parser.add_argument("--url",      default=BASE_URL)
    parser.add_argument("--headful",  action="store_true")
    parser.add_argument("--diagnose", action="store_true")
    parser.add_argument("--theme",    choices=list(THEMES.keys()), default=None,
                        help="Audit one theme only")
    parser.add_argument("--device",   choices=["desktop","mobile"], default=None,
                        help="Audit one device only")
    args = parser.parse_args()

    if args.diagnose:
        run_diagnose(base_url=args.url)
    else:
        run_audit(
            base_url=args.url,
            only_theme=args.theme,
            only_device=args.device,
            headful=args.headful,
        )