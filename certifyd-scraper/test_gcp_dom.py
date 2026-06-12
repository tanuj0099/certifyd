import asyncio
from playwright.async_api import async_playwright
import json

async def scrape_gcp():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Test index page
        await page.goto("https://cloud.google.com/learn/certification")
        await page.wait_for_load_state("networkidle")
        
        links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('/learn/certification/'));
        }''')
        
        print(f"Found links: {links[:5]}")
        
        # Test a detail page
        await page.goto("https://cloud.google.com/learn/certification/cloud-architect")
        await page.wait_for_load_state("networkidle")
        
        detail_data = await page.evaluate('''() => {
            const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText : "";
            const ps = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
            
            // GCP usually has list items for exam details and skills
            const lis = Array.from(document.querySelectorAll('li')).map(li => li.innerText.trim()).filter(li => li.length > 5 && li.length < 150);
            
            // Extract some body text to see where duration/cost sits
            const bodyText = document.body.innerText.substring(0, 4000);
            
            return { h1, ps: ps.slice(0, 15), lis: lis.slice(0, 30), bodyText };
        }''')
        
        with open('gcp_dom.json', 'w', encoding='utf-8') as f:
            json.dump({'links': list(set(links)), 'detail': detail_data}, f, indent=2, ensure_ascii=False)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_gcp())
