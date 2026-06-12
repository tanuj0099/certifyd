import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # 1. AWS Certifications Index
        print("Fetching AWS Index...")
        await page.goto("https://aws.amazon.com/certification/", wait_until="domcontentloaded")
        index_html = await page.content()
        with open("aws_index.html", "w", encoding="utf-8") as f:
            f.write(index_html)
            
        # 2. AWS Certified Cloud Practitioner (Detail)
        print("Fetching AWS Cloud Practitioner...")
        await page.goto("https://aws.amazon.com/certification/certified-cloud-practitioner/", wait_until="domcontentloaded")
        detail_html = await page.content()
        with open("aws_detail.html", "w", encoding="utf-8") as f:
            f.write(detail_html)
            
        await browser.close()
        print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
