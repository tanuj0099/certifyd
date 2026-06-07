import json
from pathlib import Path
from playwright.sync_api import sync_playwright

STORAGE_PATH = Path.home() / ".notebooklm" / "storage_state.json"
PROFILE_PATH = Path.home() / ".notebooklm" / "browser_profile"

STORAGE_PATH.parent.mkdir(parents=True, exist_ok=True)

print("Opening browser for Google login...")
with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE_PATH),
        headless=False,
        channel="chrome",
        args=["--disable-blink-features=AutomationControlled"],
    )
    page = browser.pages[0] if browser.pages else browser.new_page()
    page.goto("https://notebooklm.google.com/")

    # This pauses the script to let you log in
    input("\n*** IMPORTANT: Press ENTER here in the terminal ONLY AFTER you have fully signed in and can see your notebooks in the browser ***\n")

    print("Capturing session...")
    storage = browser.storage_state()
    with open(STORAGE_PATH, "w") as f:
        json.dump(storage, f)

    browser.close()

print(f"Authentication saved successfully to: {STORAGE_PATH}")