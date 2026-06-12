import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Google
        try:
            print("Fetching Google...")
            await page.goto("https://cloud.google.com/learn/certification", wait_until="domcontentloaded", timeout=15000)
            g_links = await page.locator("a[href*='/certification/']").all_inner_texts()
            print("Google Certs found:", len(g_links))
        except Exception as e:
            print("Google failed:", e)

        # Cisco
        try:
            print("Fetching Cisco...")
            await page.goto("https://www.cisco.com/c/en/us/training-events/training-certifications/certifications.html", wait_until="domcontentloaded", timeout=15000)
            c_links = await page.locator("a[href*='certifications/']").all_inner_texts()
            print("Cisco Certs found:", len(c_links))
        except Exception as e:
            print("Cisco failed:", e)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
