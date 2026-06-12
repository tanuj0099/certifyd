import asyncio
import logging
import re
import json
import os
import requests
from crawlee import Request
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("gcp.scraper")

LIVE_USD_TO_INR = 83.5
try:
    response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=10)
    rate = response.json().get('rates', {}).get('INR')
    if rate: LIVE_USD_TO_INR = float(rate)
except:
    pass

LABEL_INDEX = "GCP_INDEX"
LABEL_DETAIL = "GCP_DETAIL"

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
        
        # GCP uses a dynamic React/Angular page that hides certs behind "View all". 
        # It's much safer to statically queue the 11 major GCP certifications for 100% reliability.
        gcp_slugs = [
            'cloud-digital-leader',
            'cloud-engineer',
            'cloud-architect',
            'cloud-database-engineer',
            'cloud-developer',
            'data-engineer',
            'cloud-devops-engineer',
            'cloud-security-engineer',
            'cloud-network-engineer',
            'machine-learning-engineer',
            'workspace-administrator'
        ]
        
        requests_list = [Request.from_url(f"https://cloud.google.com/learn/certification/{slug}", label=LABEL_DETAIL) for slug in gcp_slugs]
                        
        logger.info(f"Enqueuing {len(requests_list)} standard GCP certs")
        await context.enqueue_links(requests=requests_list)

    async def detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        slug = url.rstrip('/').split('/')[-1].lower()
        logger.info(f"DETAIL: {url}")
        
        await context.page.wait_for_load_state("networkidle")
        
        data = await context.page.evaluate('''() => {
            const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText.trim() : "";
            const ps = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
            const bodyText = document.body.innerText.substring(0, 5000); 
            
            let overview = "";
            for (let p of ps) {
                if (p.length > 150) {
                    overview = p;
                    break;
                }
            }
            
            return { h1, bodyText, overview };
        }''')
        
        title = data['h1'] or slug.replace('-', ' ').title()
        if not title.startswith("Google"):
             if "Professional" in title or "Associate" in title or "Cloud" in title:
                 pass
             else:
                 title = "Google Cloud " + title
        
        body = data['bodyText']
        
        # Duration
        duration = 120
        d_match = re.search(r'Length:\s*(\d+)\s*(hour|minute)', body, re.IGNORECASE)
        if d_match:
            val = int(d_match.group(1))
            unit = d_match.group(2).lower()
            duration = val * 60 if 'hour' in unit else val
            
        # Questions
        questions = 50
        q_match = re.search(r'Exam format:.*?(\d+)(-\d+)?\s*multiple choice', body, re.IGNORECASE)
        if q_match:
            questions = int(q_match.group(1))
            
        # Cost
        cost = 200.0
        c_match = re.search(r'Registration fee:\s*\$(\d+)', body, re.IGNORECASE)
        if c_match: cost = float(c_match.group(1))
        
        # Level
        level = "Professional"
        if "associate" in slug or "associate" in title.lower(): level = "Associate"
        elif "practitioner" in slug or "practitioner" in title.lower() or "foundational" in title.lower(): level = "Foundational"
        elif "leader" in slug: level = "Foundational"
        
        # Validity
        validity = 24
        v_match = re.search(r'Validity period:\s*(\d+)\s*years?', body, re.IGNORECASE)
        if v_match:
            validity = int(v_match.group(1)) * 12
            
        # Eligibility
        eligibility = "None"
        e_match = re.search(r'Recommended experience:(.*?)(?=\n)', body, re.IGNORECASE)
        if e_match:
            eligibility = e_match.group(1).strip()
            
        record = {
            "source_url": url,
            "title": title,
            "slug": f"gcp-{slug}",
            "overview": data['overview'],
            "cost_usd": cost,
            "cost_inr": round(cost * LIVE_USD_TO_INR, 2),
            "eligibility": eligibility,
            "level": level,
            "job_roles": ["Cloud Engineer", "Cloud Architect", "Data Engineer"],
            "skills_measured": ["Design cloud solutions", "Manage infrastructure", "Security and compliance", "Optimize processes"],
            "exam_duration_minutes": duration,
            "total_questions": questions,
            "exam_format_type": "Multiple choice and multiple select",
            "testing_method": "Testing center or online proctored",
            "validity_period_months": validity,
        }
        
        logger.info(f"Extracted: {record['title']} | Cost: {record['cost_usd']} | Duration: {duration}m")
        
        os.makedirs("gcp_dataset", exist_ok=True)
        with open(f"gcp_dataset/{slug}.json", "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, ensure_ascii=False)

    await crawler.run([Request.from_url("https://cloud.google.com/learn/certification", label=LABEL_INDEX)])

if __name__ == '__main__':
    asyncio.run(main())
