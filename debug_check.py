"""
Run this FIRST before anything else.
It tells you exactly why the page appears blank.

Usage:
    python debug_check.py
    python debug_check.py --url http://localhost:5174
"""

import sys
import argparse
from playwright.sync_api import sync_playwright

URL = "http://localhost:5173"

parser = argparse.ArgumentParser()
parser.add_argument("--url", default=URL)
args = parser.parse_args()

print(f"\n{'='*55}")
print(f"  CertifyROI Debug Check")
print(f"  URL: {args.url}")
print(f"{'='*55}\n")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # ── Step 1: Can we even reach the server? ──────────────────
    print("[ 1 ] Navigating to URL...")
    try:
        response = page.goto(args.url, wait_until="commit", timeout=15_000)
        print(f"      HTTP status : {response.status if response else 'unknown'}")
        print(f"      Final URL   : {page.url}")
    except Exception as e:
        print(f"      FAILED: {e}")
        print("\n  ❌ Server not reachable. Is 'npm run dev' running?")
        input("\n  Press ENTER to close...")
        browser.close()
        sys.exit(1)

    # ── Step 2: Wait for DOM ───────────────────────────────────
    print("\n[ 2 ] Waiting for DOM (domcontentloaded)...")
    try:
        page.wait_for_load_state("domcontentloaded", timeout=10_000)
        print("      DOM ready ✓")
    except Exception as e:
        print(f"      Timeout: {e}")

    # ── Step 3: Check #root immediately ───────────────────────
    root_html = page.evaluate("""
        () => {
            const r = document.getElementById('root');
            return r ? r.innerHTML.slice(0, 200) : '(#root not found)';
        }
    """)
    print(f"\n[ 3 ] #root content (immediate):")
    print(f"      {root_html[:150]}")

    # ── Step 4: Wait 3 seconds, check again ───────────────────
    print("\n[ 4 ] Waiting 3 seconds for React to mount...")
    page.wait_for_timeout(3000)

    root_html2 = page.evaluate("""
        () => {
            const r = document.getElementById('root');
            return r ? r.innerHTML.slice(0, 300) : '(#root not found)';
        }
    """)
    print(f"      #root after 3s:")
    print(f"      {root_html2[:200]}")

    # ── Step 5: Check for console errors ──────────────────────
    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    page.wait_for_timeout(2000)

    title   = page.title()
    body_bg = page.evaluate("() => getComputedStyle(document.body).backgroundColor")
    el_count = page.evaluate("() => document.querySelectorAll('*').length")
    btn_count = page.evaluate("() => document.querySelectorAll('button').length")
    a_count   = page.evaluate("() => document.querySelectorAll('a').length")

    print(f"\n[ 5 ] Page state after 5s total:")
    print(f"      Title        : {title}")
    print(f"      body bg      : {body_bg}")
    print(f"      Total elements: {el_count}")
    print(f"      Buttons      : {btn_count}")
    print(f"      Links <a>    : {a_count}")

    # ── Step 6: Screenshot ────────────────────────────────────
    page.screenshot(path="debug_screenshot.png", full_page=False)
    print(f"\n[ 6 ] Screenshot saved → debug_screenshot.png")
    print(f"      (viewport only, not full page)")

    # ── Step 7: Console errors ────────────────────────────────
    if errors:
        print(f"\n[ 7 ] Console ERRORS detected:")
        for e in errors[:10]:
            print(f"      {e}")
    else:
        print(f"\n[ 7 ] No console errors detected")

    # ── Step 8: Inject bypass and reload to test it ──────────
    print("\n[ 8 ] Injecting bypass (certify-roi-journey) and reloading...")

    page.evaluate("""
        () => {
            var state = {
                targetDomain: 'Cybersecurity',
                hasSelectedMode: true,
                selectedDomain: 'Cybersecurity',
                onboardingDone: true,
                journeyMode: 'professional',
                domainSelected: true,
                mode: 'professional',
                domain: 'Cybersecurity',
            };
            var payload = JSON.stringify({ state: state, version: 0 });

            // The confirmed key
            localStorage.setItem('certify-roi-journey', payload);

            // Fallbacks
            ['journey-store','certifyroi-journey','certifyroi-store',
             'certify-roi-store','app-store'].forEach(function(k) {
                localStorage.setItem(k, payload);
            });

            // Flat keys
            localStorage.setItem('targetDomain',    'Cybersecurity');
            localStorage.setItem('hasSelectedMode', 'true');
            localStorage.setItem('onboardingDone',  'true');
            localStorage.setItem('journeyMode',     'professional');
        }
    """)

    # Reload so React re-reads localStorage on mount
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(4000)

    # Take another screenshot to verify gate is gone
    page.screenshot(path='debug_after_bypass.png', full_page=False)
    print("      Screenshot saved -> debug_after_bypass.png")

    # Check if gate is still showing
    gate_check = page.evaluate("""
        () => {
            const body = document.body.innerText || '';
            const gateWords = ['select your domain', 'choose your goal',
                               'get started', 'pick a path'];
            return gateWords.filter(k => body.toLowerCase().includes(k));
        }
    """)
    ls_key = page.evaluate(
        "() => localStorage.getItem('certify-roi-journey')"
    )
    print(f"      localStorage['certify-roi-journey'] set: {bool(ls_key)}")
    if ls_key:
        print(f"      Value preview: {ls_key[:120]}")

    if gate_check:
        print(f"\n      Gate still showing: {gate_check}")
        print(f"      Check useJourneyStore.js — what field controls the gate?")
    else:
        print(f"\n      Gate appears bypassed! Check debug_after_bypass.png")

    # ── Diagnosis ─────────────────────────────────────────────
    print(f"\n{'='*55}")
    print(f"  DIAGNOSIS:")
    if el_count < 10:
        print(f"  ❌ Almost no elements ({el_count}) — React crashed or")
        print(f"     failed to mount. Check debug_screenshot.png")
        print(f"     and look for a JS error in the browser console.")
    elif btn_count == 0 and a_count == 0:
        print(f"  ⚠️  Elements found ({el_count}) but no buttons or links.")
        print(f"     App may be showing a loading/gate screen.")
    else:
        print(f"  ✅ App looks loaded ({el_count} elements,")
        print(f"     {btn_count} buttons, {a_count} links)")
        print(f"     Check debug_screenshot.png to confirm.")
    print(f"{'='*55}\n")

    input("  Press ENTER to close browser...")
    browser.close()