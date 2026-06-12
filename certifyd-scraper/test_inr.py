import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Check Cisco India
        try:
            print("Checking Cisco India...")
            await page.goto("https://www.cisco.com/c/en_in/training-events/training-certifications/certifications.html", wait_until="networkidle", timeout=15000)
            text = await page.content()
            print("Contains INR?", 'INR' in text)
            print("Contains Rs?", 'Rs' in text)
            print("Contains USD?", 'USD' in text)
        except Exception as e:
            print("Cisco Error:", e)

        # Check AWS Pricing Policy
        try:
            print("\nChecking AWS Pricing...")
            await page.goto("https://aws.amazon.com/certification/policies/before-testing/", wait_until="networkidle", timeout=15000)
            text = await page.content()
            print("Contains INR?", 'INR' in text)
        except Exception as e:
            pass

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
