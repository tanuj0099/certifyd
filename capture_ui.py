from playwright.sync_api import sync_playwright
import os
import shutil

# 1. SETTINGS: Change these to match your actual local server
BASE_URL = "http://localhost:5173"
TARGET_DOMAIN = "Cybersecurity" # The domain we want to "fake" for the test

PAGES = {
    "dashboard_pro": f"{BASE_URL}/app?mode=professional",
    "dashboard_pivot": f"{BASE_URL}/app?mode=switcher",
    "comparison_view": f"{BASE_URL}/app?mode=compare"
}

def capture_ui():
    # --- AUTO-DELETE OLD PICTURES ---
    folder = "ui_review"
    if os.path.exists(folder):
        print(f"Cleaning up old screenshots in {folder}...")
        shutil.rmtree(folder) # Deletes the whole folder and its contents
    
    os.makedirs(folder)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # Define the viewports for review
        views = [
            {"name": "desktop", "width": 1440, "height": 900},
            {"name": "mobile", "width": 375, "height": 812}
        ]

        for view in views:
            print(f"\n--- Capturing {view['name']} ---")
            
            # Create a context (browser instance)
            context = browser.new_context(viewport={"width": view['width'], "height": view['height']})
            
            # --- BYPASS THE SELECTION SCREEN ---
            # We inject a script that runs BEFORE the page loads. 
            # This "fakes" the state in your Zustand/Local Storage so the app thinks 
            # you already picked a domain.
            context.add_init_script(f"""
                window.localStorage.setItem('journey-store', JSON.stringify({{
                    state: {{
                        targetDomain: '{TARGET_DOMAIN}',
                        hasSelectedMode: true
                    }}
                }}));
            """)

            page = context.new_page()

            for name, url in PAGES.items():
                print(f"  > Capturing {name}...")
                try:
                    page.goto(url)
                    # Wait for the "Linear" animations to settle
                    page.wait_for_timeout(1500) 
                    
                    filename = f"{folder}/{name}_{view['name']}.png"
                    page.screenshot(path=filename, full_page=True)
                except Exception as e:
                    print(f"  ! Error on {name}: {e}")

            context.close()

        browser.close()
        print(f"\nSuccess! Review your unboxed Vercel-style UI in the '{folder}' folder.")

if __name__ == "__main__":
    capture_ui()