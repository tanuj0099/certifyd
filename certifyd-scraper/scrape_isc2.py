import asyncio
import logging
import re
import json
import os
import requests
from crawlee import Glob, Request
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("isc2.scraper")

LIVE_USD_TO_INR = 83.5
try:
    response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=10)
    rate = response.json().get('rates', {}).get('INR')
    if rate: LIVE_USD_TO_INR = float(rate)
except:
    pass

LABEL_INDEX = "ISC2_INDEX"
LABEL_DETAIL = "ISC2_DETAIL"

ISC2_STATIC_DATA = {
    'cc': {'exp': 'No Work Experience Required', 'cost': 50.0},
    'sscp': {'exp': '1 Year', 'cost': 249.0},
    'cgrc': {'exp': '2 Years', 'cost': 599.0},
    'csslp': {'exp': '4 Years', 'cost': 599.0},
    'ccsp': {'exp': '5 Years', 'cost': 599.0},
    'cissp': {'exp': '5 Years', 'cost': 749.0},
    'issap': {'exp': 'CISSP + 2 Years or 7 years cumulative', 'cost': 599.0},
    'issep': {'exp': 'CISSP + 2 Years or 7 years cumulative', 'cost': 599.0},
    'issmp': {'exp': 'CISSP + 2 Years or 7 years cumulative', 'cost': 599.0},
}

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
            if '/certifications/' in url and '#' not in url and '?' not in url:
                slug = url.split('/')[-1].lower()
                if slug in ISC2_STATIC_DATA and slug not in seen:
                    seen.add(slug)
                    requests_list.append(Request.from_url(url, label=LABEL_DETAIL))
                    
        await context.enqueue_links(requests=requests_list)

    async def detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        slug = url.split('/')[-1].lower()
        static_info = ISC2_STATIC_DATA.get(slug, {})
        
        data = await context.page.evaluate('''() => {
            const h1 = document.querySelector('h1');
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            const getSectionText = (keyword) => {
                const h = headings.find(h => h.innerText.toLowerCase().includes(keyword.toLowerCase()));
                if (!h) return "";
                let text = "";
                let curr = h.nextElementSibling;
                while (curr && !['H1','H2','H3'].includes(curr.tagName)) {
                    text += " " + curr.innerText.trim();
                    curr = curr.nextElementSibling;
                }
                return text.trim();
            };
            
            // Filter list items that might be skills (longer than 10 chars, not nav links)
            const listItems = Array.from(document.querySelectorAll('li'))
                .map(li => li.innerText.trim())
                .filter(t => t.length > 15 && t.length < 150 && !t.includes('Cookie'));
                
            return {
                title: h1 ? h1.innerText.trim() : "",
                overview: getSectionText('overview') || getSectionText('what is'),
                listItems: listItems
            };
        }''')
        
        cost = static_info.get('cost', 599.0)
        eligibility = static_info.get('exp', 'See ISC2 official site.')
        
        level = "Professional"
        if slug in ["cc", "sscp"]:
            level = "Foundational"
            
        # Write to JSON
        record = {
            "source_url": url,
            "title": data['title'] or f"ISC2 {slug.upper()}",
            "slug": f"isc2-{slug}",
            "overview": data['overview'] or "Official ISC2 Certification.",
            "cost_usd": cost,
            "cost_inr": round(cost * LIVE_USD_TO_INR, 2),
            "eligibility": eligibility,
            "level": level,
            "job_roles": [],
            "skills_measured": data['listItems'][:6],
            "exam_duration_minutes": 180 if cost > 400 else 120,
            "total_questions": 125 if cost > 400 else 100,
            "exam_format_type": "Standard Proctored Exam",
            "testing_method": "Online Proctored & Testing Center",
            "validity_period_months": 36,
        }
        
        logger.info(f"Extracted: {record['title']} | Cost: {record['cost_usd']} | Elig: {record['eligibility']}")
        
        # Save to local dataset mimicking Crawlee
        os.makedirs("isc2_dataset", exist_ok=True)
        with open(f"isc2_dataset/{slug}.json", "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, ensure_ascii=False)

    await crawler.run([Request.from_url("https://www.isc2.org/Certifications", label=LABEL_INDEX)])

if __name__ == '__main__':
    asyncio.run(main())
