import asyncio
from playwright.async_api import async_playwright
import json

async def scrape_issmp():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.isc2.org/certifications/issmp")
        await page.wait_for_load_state("networkidle")
        
        # Grab all headings and text blocks to understand the structure
        content = await page.evaluate('''() => {
            const result = {};
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.innerText.trim() : null;
            };
            
            result.title = getText('h1');
            result.headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({tag: h.tagName, text: h.innerText.trim()}));
            
            // Try to find eligibility/experience
            const pText = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
            result.paragraphs = pText.slice(0, 10); // get first 10
            
            // Price?
            result.bodyText = document.body.innerText.substring(0, 1000);
            return result;
        }''')
        
        with open('issmp_dom.json', 'w') as f:
            json.dump(content, f, indent=2)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_issmp())
