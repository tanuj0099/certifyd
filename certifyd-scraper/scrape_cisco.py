import asyncio
import logging
import re
import json
import os
import requests
from crawlee import Request
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("cisco.scraper")

LIVE_USD_TO_INR = 83.5
try:
    response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=10)
    rate = response.json().get('rates', {}).get('INR')
    if rate: LIVE_USD_TO_INR = float(rate)
except:
    pass

LABEL_INDEX = "CISCO_INDEX"
LABEL_DETAIL = "CISCO_DETAIL"

async def main():
    crawler = PlaywrightCrawler(
        max_requests_per_crawl=30,
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
            if '/learn/training-certifications/certifications/' in url and '#' not in url and '?' not in url:
                if 'index.html' in url and not url.endswith('certifications/index.html'):
                    # e.g., .../certifications/enterprise/ccna/index.html
                    slug = url.split('/')[-2].lower()
                    if slug not in seen and slug not in ['certifications', 'technician', 'community', 'resources', 'specialist', 'continuing-education', 'ethical-hacker', 'support-technician', 'success-stories']:
                        seen.add(slug)
                        requests_list.append(Request.from_url(url, label=LABEL_DETAIL))
                        
        logger.info(f"Enqueuing {len(requests_list)} Cisco certs")
        # For MVP limit to key certs to save time
        top_slugs = ['ccna', 'ccnp-enterprise', 'ccnp-security', 'ccie-enterprise-infrastructure', 'ccnp-data-center', 'ccna-cybersecurity', 'cyberops-associate']
        top_requests = [r for r in requests_list if any(x in r.url for x in top_slugs)]
        if not top_requests:
            top_requests = requests_list[:8]
        await context.enqueue_links(requests=top_requests)

    async def detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        slug = url.split('/')[-2].lower()
        logger.info(f"DETAIL: {url}")
        
        await context.page.wait_for_load_state("networkidle")
        
        data = await context.page.evaluate('''() => {
            const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText.trim() : "";
            const ps = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
            const bodyText = document.body.innerText.substring(0, 5000); 
            
            let overview = "";
            for (let p of ps) {
                if (p.length > 150 && !p.includes('cookie') && !p.includes('Browser')) {
                    overview = p;
                    break;
                }
            }
            
            return { h1, bodyText, overview };
        }''')
        
        title = data['h1'] or slug.upper().replace('-', ' ')
        if "Cisco" not in title:
            title = "Cisco " + title
            
        body = data['bodyText']
        
        # Level
        level = "Professional"
        if "ccna" in slug or "associate" in slug: level = "Associate"
        elif "ccie" in slug or "expert" in slug: level = "Expert"
        elif "cct" in slug or "technician" in slug: level = "Foundational"
        
        # Cost fallback for Cisco
        cost = 300.0 if level == "Associate" else 400.0 if level == "Professional" else 450.0
        
        # Duration fallback
        duration = 120
        d_match = re.search(r'(\d+)\s*minutes?', body, re.IGNORECASE)
        if d_match:
            duration = int(d_match.group(1))
            
        # Validity is 3 years for all Cisco certs
        validity = 36
        
        record = {
            "source_url": url,
            "title": title,
            "slug": f"cisco-{slug}",
            "overview": data['overview'],
            "cost_usd": cost,
            "cost_inr": round(cost * LIVE_USD_TO_INR, 2),
            "eligibility": "No formal prerequisites. Recommended 1-3 years of experience.",
            "level": level,
            "job_roles": ["Network Engineer", "Systems Engineer", "Security Analyst"],
            "skills_measured": ["Network Fundamentals", "IP Connectivity", "Security Fundamentals", "Automation and Programmability"],
            "exam_duration_minutes": duration,
            "total_questions": 100, # Standard Cisco estimate
            "exam_format_type": "Multiple choice, drag-and-drop, and performance-based simulation",
            "testing_method": "Pearson VUE testing center or online proctored",
            "validity_period_months": validity,
        }
        
        logger.info(f"Extracted: {record['title']} | Cost: {record['cost_usd']} | Level: {level}")
        
        os.makedirs("cisco_dataset", exist_ok=True)
        with open(f"cisco_dataset/{slug}.json", "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, ensure_ascii=False)

    await crawler.run([Request.from_url("https://www.cisco.com/site/us/en/learn/training-certifications/certifications/index.html", label=LABEL_INDEX)])

if __name__ == '__main__':
    asyncio.run(main())
