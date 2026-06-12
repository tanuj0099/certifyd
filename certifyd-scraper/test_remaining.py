import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # 1. CompTIA
        try:
            print("Checking CompTIA...")
            await page.goto("https://www.comptia.org/certifications", wait_until="domcontentloaded", timeout=15000)
            links = await page.locator("a[href*='/certifications/']").all_inner_texts()
            print("CompTIA links found:", len(links))
        except Exception as e:
            print("CompTIA Error:", e)

        # 2. OffSec
        try:
            print("Checking OffSec...")
            await page.goto("https://www.offsec.com/courses-and-certifications/", wait_until="domcontentloaded", timeout=15000)
            links = await page.locator("a").all_inner_texts()
            print("OffSec links found:", len(links))
        except Exception as e:
            print("OffSec Error:", e)
            
        # 3. LPI
        try:
            print("Checking LPI...")
            await page.goto("https://www.lpi.org/our-certifications/", wait_until="domcontentloaded", timeout=15000)
            links = await page.locator("a").all_inner_texts()
            print("LPI links found:", len(links))
        except Exception as e:
            print("LPI Error:", e)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
