from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
import time

with Stealth().use_sync(sync_playwright()) as p:
    browser = p.chromium.launch(headless=True, args=["--disable-http2", "--disable-blink-features=AutomationControlled", "--no-sandbox"])
    page = browser.new_page()
    url = "https://www.ambitionbox.com/profile/data-engineer-salary"
    print(f"Fetching {url}")
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        print("Title:", page.title())
    except Exception as e:
        print("Error:", e)
    browser.close()
