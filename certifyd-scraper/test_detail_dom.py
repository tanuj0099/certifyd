import asyncio
from playwright.async_api import async_playwright
import json
import re

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # 1. Google Cloud Detail
        print("--- Google Cloud ---")
        await page.goto("https://cloud.google.com/learn/certification/cloud-architect", wait_until="networkidle", timeout=25000)
        
        try:
            title = await page.locator("h1").first.inner_text()
            print("Title:", title)
            
            paragraphs = await page.locator("p").all_inner_texts()
            meaningful_p = [p.strip() for p in paragraphs if len(p.strip()) > 50 and 'cookie' not in p.lower()]
            print("Overview:", meaningful_p[0] if meaningful_p else "None")
            
            html = await page.content()
            cost_match = re.search(r'(\d+)\s*USD', html) or re.search(r'\$(\d+)', html)
            print("Cost:", cost_match.group(1) if cost_match else "None")
        except Exception as e:
            print("Error GC:", e)

        # 2. Cisco Detail
        print("\n--- Cisco ---")
        await page.goto("https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html", wait_until="networkidle", timeout=25000)
        
        try:
            title = await page.locator("h1").first.inner_text()
            print("Title:", title)
            
            paragraphs = await page.locator("p").all_inner_texts()
            meaningful_p = [p.strip() for p in paragraphs if len(p.strip()) > 50 and 'cookie' not in p.lower() and 'privacy' not in p.lower() and 'cisco' in p.lower()]
            print("Overview:", meaningful_p[0] if meaningful_p else "None")
            
            html = await page.content()
            cost_match = re.search(r'(\d+)\s*USD', html) or re.search(r'\$(\d+)', html)
            print("Cost:", cost_match.group(1) if cost_match else "None")
        except Exception as e:
            print("Error Cisco:", e)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
