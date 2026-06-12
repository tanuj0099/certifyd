import asyncio
import logging
import re
import json
import os
import requests
from crawlee import Request
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("aws.scraper")

LIVE_USD_TO_INR = 83.5
try:
    response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=10)
    rate = response.json().get('rates', {}).get('INR')
    if rate: LIVE_USD_TO_INR = float(rate)
except:
    pass

LABEL_INDEX = "AWS_INDEX"
LABEL_DETAIL = "AWS_DETAIL"

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
            if '/certification/certified-' in url and '#' not in url and '?' not in url:
                slug = url.rstrip('/').split('/')[-1].lower()
                if slug not in seen:
                    seen.add(slug)
                    requests_list.append(Request.from_url(url, label=LABEL_DETAIL))
                        
        logger.info(f"Enqueuing {len(requests_list)} AWS certs")
        await context.enqueue_links(requests=requests_list)

    async def detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        slug = url.rstrip('/').split('/')[-1].lower()
        logger.info(f"DETAIL: {url}")
        
        await context.page.wait_for_load_state("networkidle")
        
        data = await context.page.evaluate('''() => {
            const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText.trim() : "";
            const ps = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
            const lis = Array.from(document.querySelectorAll('li')).map(li => li.innerText.trim()).filter(Boolean);
            const bodyText = document.body.innerText.substring(0, 4000); // AWS puts details near the top
            
            // Try to find the overview text. It's usually the first big paragraph after the H1
            let overview = "";
            for (let p of ps) {
                if (p.length > 100 && !p.includes('cookie') && !p.includes('Cookie')) {
                    overview = p;
                    break;
                }
            }
            
            return { h1, bodyText, overview, lis: lis.slice(0, 30) };
        }''')
        
        title = data['h1'] or slug.replace('-', ' ').title()
        body = data['bodyText']
        
        # Extract Duration
        duration = 130
        d_match = re.search(r'Exam duration\s+(\d+)\s+minutes', body, re.IGNORECASE)
        if d_match: duration = int(d_match.group(1))
        
        # Extract Questions
        questions = 65
        q_match = re.search(r'Exam format\s+(\d+)\s+questions', body, re.IGNORECASE)
        if q_match: questions = int(q_match.group(1))
        
        # Extract Cost
        cost = 150.0
        c_match = re.search(r'Cost\s+(\d+)\s+USD', body, re.IGNORECASE)
        if c_match: cost = float(c_match.group(1))
        elif "practitioner" in slug: cost = 100.0
        elif "professional" in slug or "specialty" in slug: cost = 300.0
        
        # Level
        level = "Foundational"
        if "associate" in slug: level = "Associate"
        elif "professional" in slug or "specialty" in slug: level = "Professional"
        
        record = {
            "source_url": url,
            "title": title,
            "slug": f"aws-{slug}",
            "overview": data['overview'],
            "cost_usd": cost,
            "cost_inr": round(cost * LIVE_USD_TO_INR, 2),
            "eligibility": "None strictly required. AWS provides recommendations per certification.",
            "level": level,
            "job_roles": ["Cloud Engineer", "Solutions Architect", "DevOps Engineer", "SysOps Administrator"],
            "skills_measured": data['lis'][:6],
            "exam_duration_minutes": duration,
            "total_questions": questions,
            "exam_format_type": "Multiple choice or multiple response",
            "testing_method": "Pearson VUE testing center or online proctored exam",
            "validity_period_months": 36,
        }
        
        logger.info(f"Extracted: {record['title']} | Cost: {record['cost_usd']} | Duration: {duration}m")
        
        os.makedirs("aws_dataset", exist_ok=True)
        with open(f"aws_dataset/{slug}.json", "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, ensure_ascii=False)

    await crawler.run([Request.from_url("https://aws.amazon.com/certification/", label=LABEL_INDEX)])

if __name__ == '__main__':
    asyncio.run(main())
