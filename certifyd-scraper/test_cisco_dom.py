import asyncio
from playwright.async_api import async_playwright
import json

async def scrape_cisco():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Test an index/search page
        await page.goto("https://www.cisco.com/c/en/us/training-events/training-certifications/certifications.html")
        await page.wait_for_load_state("domcontentloaded")
        
        links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('/training-certifications/certifications/'));
        }''')
        
        print(f"Found links: {links[:5]}")
        
        # Test a detail page (e.g. CCNA)
        await page.goto("https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html")
        await page.wait_for_load_state("domcontentloaded")
        
        detail_data = await page.evaluate('''() => {
            const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText : "";
            const ps = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
            const lis = Array.from(document.querySelectorAll('li')).map(li => li.innerText.trim()).filter(Boolean);
            
            // Extract body text to see where details are
            const details = document.body.innerText.substring(0, 3000);
            
            return { h1, ps: ps.slice(0, 15), lis: lis.slice(0, 20), details };
        }''')
        
        with open('cisco_dom.json', 'w', encoding='utf-8') as f:
            json.dump({'links': list(set(links)), 'detail': detail_data}, f, indent=2, ensure_ascii=False)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_cisco())
