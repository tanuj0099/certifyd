import asyncio
from playwright.async_api import async_playwright
import json

async def scrape_msft():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Test an index/search page
        await page.goto("https://learn.microsoft.com/en-us/credentials/browse/?credential_types=certification")
        await page.wait_for_load_state("networkidle")
        
        links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('/credentials/certifications/'));
        }''')
        
        print(f"Found links: {links[:5]}")
        
        # Test a detail page
        await page.goto("https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/")
        await page.wait_for_load_state("networkidle")
        
        detail_data = await page.evaluate('''() => {
            const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText : "";
            const ps = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
            const lis = Array.from(document.querySelectorAll('li')).map(li => li.innerText.trim()).filter(Boolean);
            
            // Look for details in list items or paragraphs near the top
            const details = document.body.innerText.substring(0, 3000);
            
            return { h1, ps: ps.slice(0, 15), lis: lis.slice(0, 20), details };
        }''')
        
        with open('msft_dom.json', 'w', encoding='utf-8') as f:
            json.dump({'links': list(set(links)), 'detail': detail_data}, f, indent=2, ensure_ascii=False)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_msft())
