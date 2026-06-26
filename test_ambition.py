from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    url = "https://www.ambitionbox.com/profile/data-engineer-salary"
    print(f"Fetching {url}")
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    print("Title:", page.title())
    html = page.content()
    print("Length of HTML:", len(html))
    if "Cloudflare" in html or "Access Denied" in html:
        print("BLOCKED BY CLOUDFLARE/BOT PROTECTION")
    if "Lakh" in html:
        print("Found 'Lakh' in HTML")
    else:
        print("Did not find 'Lakh' in HTML")
    browser.close()
