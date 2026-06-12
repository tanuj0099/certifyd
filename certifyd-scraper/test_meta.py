import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('https://learn.microsoft.com/en-in/credentials/certifications/azure-database-administrator-associate/', wait_until='networkidle')
        
        script = """
        () => {
            const getNextText = (label) => {
                const els = [...document.querySelectorAll('div, span, li, p')];
                const target = els.find(e => e.innerText && e.innerText.trim() === label);
                if (target && target.nextElementSibling) {
                    return target.nextElementSibling.innerText.trim();
                }
                if (target && target.parentElement && target.parentElement.nextElementSibling) {
                    return target.parentElement.nextElementSibling.innerText.trim();
                }
                return '';
            }
            
            const els = [...document.querySelectorAll('*')];
            const textNodes = els.filter(e => e.childElementCount === 0 && e.innerText);
            
            const findSiblingOf = (label) => {
                const t = textNodes.find(e => e.innerText.trim() === label);
                if (!t) return 'NOT FOUND';
                if (t.nextElementSibling) return t.nextElementSibling.innerText.trim();
                if (t.parentElement && t.parentElement.children.length > 1) {
                    const idx = [...t.parentElement.children].indexOf(t);
                    if (idx + 1 < t.parentElement.children.length) {
                        return t.parentElement.children[idx+1].innerText.trim();
                    }
                }
                return 'NOT FOUND SIBLING';
            }
            
            return {
                role: findSiblingOf('Role:'),
                level: findSiblingOf('Level:'),
                lang: findSiblingOf('Languages:')
            };
        }
        """
        res = await page.evaluate(script)
        print('METADATA:\n', res)
        
        script2 = """
        () => {
            const banners = [...document.querySelectorAll('.is-warning, .warning, [class*="warning"]')];
            return banners.map(b => b.innerText.trim()).filter(t => t.toLowerCase().includes('retir'));
        }
        """
        retiring = await page.evaluate(script2)
        print('RETIRING:\n', retiring)
        
        await browser.close()

asyncio.run(main())
