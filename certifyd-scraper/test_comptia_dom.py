import asyncio
from playwright.async_api import async_playwright
import json

async def scrape_comptia():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Test index page
        await page.goto("https://www.comptia.org/certifications")
        await page.wait_for_load_state("networkidle")
        
        links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('/certifications/'));
        }''')
        
        # Test a detail page
        await page.goto("https://www.comptia.org/certifications/security")
        await page.wait_for_load_state("networkidle")
        
        detail_data = await page.evaluate('''() => {
            const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText : "";
            const tables = Array.from(document.querySelectorAll('table')).map(t => {
                const rows = Array.from(t.querySelectorAll('tr')).map(tr => {
                    return Array.from(tr.querySelectorAll('th, td')).map(td => td.innerText.trim());
                });
                return rows;
            });
            const p = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim());
            return { h1, tables, p: p.slice(0, 20) };
        }''')
        
        with open('comptia_dom.json', 'w', encoding='utf-8') as f:
            json.dump({'links': list(set(links)), 'detail': detail_data}, f, indent=2, ensure_ascii=False)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_comptia())
