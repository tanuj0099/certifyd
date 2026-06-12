import asyncio
import logging
import re
import json
import os
import requests
from crawlee import Request
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("msft.scraper")

LIVE_USD_TO_INR = 83.5
try:
    response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=10)
    rate = response.json().get('rates', {}).get('INR')
    if rate: LIVE_USD_TO_INR = float(rate)
except:
    pass

LABEL_INDEX = "MSFT_INDEX"
LABEL_DETAIL = "MSFT_DETAIL"

async def main():
    crawler = PlaywrightCrawler(
        max_requests_per_crawl=50,
        headless=True,
    )

    @crawler.router.default_handler
    async def default_handler(context: PlaywrightCrawlingContext) -> None:
        label = context.request.label
        if label == LABEL_INDEX:
            await index_handler(context)
        elif label == LABEL_DETAIL:
            await detail_handler(context)

    async def index_handler(context: PlaywrightCrawlingContext) -> None:
        logger.info(f"INDEX: {context.request.url}")
        await context.page.wait_for_load_state("networkidle")
        
        hrefs = await context.page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
        }''')
        
        seen = set()
        requests_list = []
        for url in hrefs:
            if '/credentials/certifications/' in url and '#' not in url and '?' not in url:
                slug = url.rstrip('/').split('/')[-1].lower()
                if slug not in seen and slug not in ['browse', 'renewals', 'certifications']:
                    seen.add(slug)
                    requests_list.append(Request.from_url(url, label=LABEL_DETAIL))
                        
        logger.info(f"Enqueuing {len(requests_list)} MSFT certs")
        # Just queue a few important ones for the MVP to prevent long runs
        top_certs = [r for r in requests_list if any(x in r.url for x in ['azure-administrator', 'azure-developer', 'azure-solutions-architect', 'azure-security-engineer', 'azure-data-fundamentals', 'azure-fundamentals', 'm365-administrator-expert'])]
        await context.enqueue_links(requests=top_certs)

    async def detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        slug = url.rstrip('/').split('/')[-1].lower()
        logger.info(f"DETAIL: {url}")
        
        await context.page.wait_for_load_state("networkidle")
        
        data = await context.page.evaluate('''() => {
            const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText.trim() : "";
            const ps = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
            const bodyText = document.body.innerText.substring(0, 3000); 
            
            // Skills are usually under "Skills earned upon completion" or similar unordered lists
            const lis = Array.from(document.querySelectorAll('ul li')).map(li => li.innerText.trim()).filter(li => li.length > 10 && li.length < 100);
            
            let overview = "";
            for (let p of ps) {
                if (p.length > 150 && !p.includes('cookie') && !p.includes('Browser') && !p.includes('Spots filling')) {
                    overview = p;
                    break;
                }
            }
            
            return { h1, bodyText, overview, lis: lis.slice(0, 8) };
        }''')
        
        title = data['h1'] or slug.replace('-', ' ').title()
        body = data['bodyText']
        
        # Level
        level = "Professional"
        l_match = re.search(r'Level\s+(Beginner|Intermediate|Advanced|Expert)', body, re.IGNORECASE)
        if l_match:
            lvl = l_match.group(1).title()
            level = "Foundational" if lvl == "Beginner" else "Professional" if lvl == "Intermediate" else "Expert"
            
        # Role
        roles = ["IT Professional"]
        r_match = re.search(r'Role\s+([A-Za-z\s]+)\s+Renewal', body, re.IGNORECASE)
        if r_match: roles = [r_match.group(1).strip()]
        
        # Validity
        validity = 12
        v_match = re.search(r'Renewal Frequency\s+(\d+)\s+months', body, re.IGNORECASE)
        if v_match: validity = int(v_match.group(1))
        
        # Default Microsoft parameters since they redirect to Pearson for specifics
        cost = 99.0 if level == "Foundational" else 165.0
        duration = 100 if level == "Foundational" else 120
        questions = 45 if level == "Foundational" else 60
        
        record = {
            "source_url": url,
            "title": title,
            "slug": f"msft-{slug}",
            "overview": data['overview'],
            "cost_usd": cost,
            "cost_inr": round(cost * LIVE_USD_TO_INR, 2),
            "eligibility": "None strictly required. Prior knowledge of Microsoft cloud technologies recommended.",
            "level": level,
            "job_roles": roles,
            "skills_measured": data['lis'] if data['lis'] else ["Deploying cloud infrastructure", "Managing identities", "Configuring virtual networks"],
            "exam_duration_minutes": duration,
            "total_questions": questions,
            "exam_format_type": "Multiple choice, case studies, and performance-based labs",
            "testing_method": "Pearson VUE testing center or online proctored",
            "validity_period_months": validity,
        }
        
        logger.info(f"Extracted: {record['title']} | Cost: {record['cost_usd']} | Level: {level}")
        
        os.makedirs("msft_dataset", exist_ok=True)
        with open(f"msft_dataset/{slug}.json", "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, ensure_ascii=False)

    await crawler.run([Request.from_url("https://learn.microsoft.com/en-us/credentials/browse/?credential_types=certification", label=LABEL_INDEX)])

if __name__ == '__main__':
    asyncio.run(main())
