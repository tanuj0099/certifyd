import asyncio
from playwright.async_api import async_playwright
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://aws.amazon.com/certification/certified-cloud-practitioner/", wait_until="networkidle")
        
        # Overview
        paragraphs = await page.locator("p").all_inner_texts()
        meaningful_p = [p.strip() for p in paragraphs if len(p.strip()) > 60 and 'cookie' not in p.lower() and 'privacy' not in p.lower()]
        
        print("--- Paragraphs ---")
        for i, p in enumerate(meaningful_p[:5]):
            print(f"{i}: {p}")
            
        # Lists (could be skills or roles)
        lists = await page.locator("ul li").all_inner_texts()
        meaningful_li = [li.strip() for li in lists if len(li.strip()) > 30 and 'cookie' not in li.lower()]
        
        print("\n--- List Items ---")
        for i, li in enumerate(meaningful_li[:5]):
            print(f"{i}: {li}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
