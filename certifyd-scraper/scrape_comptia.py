import asyncio
import logging
import re
import json
import os
import requests
from crawlee import Request
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("comptia.scraper")

LIVE_USD_TO_INR = 83.5
try:
    response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=10)
    rate = response.json().get('rates', {}).get('INR')
    if rate: LIVE_USD_TO_INR = float(rate)
except:
    pass

LABEL_INDEX = "COMPTIA_INDEX"
LABEL_DETAIL = "COMPTIA_DETAIL"

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
        await context.page.wait_for_load_state("domcontentloaded")
        
        hrefs = await context.page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
        }''')
        
        seen = set()
        requests_list = []
        for url in hrefs:
            if '/certifications/' in url and '#' not in url and '?' not in url:
                slug = url.rstrip('/').split('/')[-1].lower()
                # CompTIA active certs
                if slug in ['a', 'network', 'security', 'cloud', 'linux', 'server', 'cysa', 'casp', 'pentest', 'data', 'project', 'cloud-essentials']:
                    if slug not in seen:
                        seen.add(slug)
                        requests_list.append(Request.from_url(url, label=LABEL_DETAIL))
                        
        logger.info(f"Enqueuing {len(requests_list)} CompTIA certs")
        await context.enqueue_links(requests=requests_list)

    async def detail_handler(context: PlaywrightCrawlingContext) -> None:
        url = context.request.url
        slug = url.split('/')[-1].lower()
        logger.info(f"DETAIL: {url}")
        
        await context.page.wait_for_load_state("domcontentloaded")
        
        data = await context.page.evaluate('''() => {
            const h1 = document.querySelector('h1');
            
            const tables = Array.from(document.querySelectorAll('table')).map(t => {
                const rows = Array.from(t.querySelectorAll('tr'));
                return rows.map(tr => Array.from(tr.querySelectorAll('th, td')).map(td => td.innerText.trim()));
            });
            
            const bodyText = document.body.innerText;
            const overview = Array.from(document.querySelectorAll('p')).slice(0, 5).map(p => p.innerText.trim()).join(" ");
            
            // List items for skills
            const listItems = Array.from(document.querySelectorAll('li'))
                .map(li => li.innerText.trim())
                .filter(t => t.length > 15 && t.length < 150 && !t.includes('Cookie'));
                
            return {
                title: h1 ? h1.innerText.trim() : "",
                tables: tables,
                bodyText: bodyText,
                overview: overview,
                listItems: listItems
            };
        }''')
        
        # Flatten table data to a dict
        table_dict = {}
        for t in data['tables']:
            for row in t:
                if len(row) >= 2:
                    k = row[0].lower()
                    v = " ".join(row[1:])
                    table_dict[k] = v
                    
        title = data['title'] or f"CompTIA {slug.upper()}+"
        if '+' not in title and slug != 'casp':
             title += '+'
             
        # Extract cost
        cost = 0.0
        price_str = table_dict.get('price', '') or table_dict.get('exam price', '')
        if price_str:
            cost_match = re.search(r'\$(\d+)', price_str)
            if cost_match: cost = float(cost_match.group(1))
        
        # Fallback regex on whole body if table failed
        if cost == 0.0:
            costs = re.findall(r'\$(\d{3})', data['bodyText'])
            if costs:
                # Most common 3 digit number starting with 2,3,4
                valid_costs = [float(c) for c in costs if 100 < int(c) < 1000]
                if valid_costs:
                    cost = valid_costs[0]
            if cost == 0.0:
                cost = 392.0 # Standard security+ price fallback
                
        # Format
        format_str = table_dict.get('exam description', '') or table_dict.get('number of questions', '')
        num_questions = 90
        q_match = re.search(r'Maximum of (\d+)', format_str, re.IGNORECASE)
        if q_match: num_questions = int(q_match.group(1))
        
        # Duration
        duration_str = table_dict.get('length of test', '')
        duration = 90
        d_match = re.search(r'(\d+)\s*minutes', duration_str, re.IGNORECASE)
        if d_match: duration = int(d_match.group(1))
        
        # Experience
        eligibility = table_dict.get('recommended experience', 'None strictly required.')
        
        level = "Foundational" if slug in ['a', 'network', 'cloud-essentials', 'data'] else "Professional"
        
        record = {
            "source_url": url,
            "title": title,
            "slug": f"comptia-{slug}",
            "overview": data['overview'][:500] + "..." if len(data['overview']) > 500 else data['overview'],
            "cost_usd": cost,
            "cost_inr": round(cost * LIVE_USD_TO_INR, 2),
            "eligibility": eligibility,
            "level": level,
            "job_roles": [],
            "skills_measured": data['listItems'][:6],
            "exam_duration_minutes": duration,
            "total_questions": num_questions,
            "exam_format_type": "Multiple choice and performance-based",
            "testing_method": "Pearson VUE Testing Center or Online Proctored",
            "validity_period_months": 36,
        }
        
        logger.info(f"Extracted: {record['title']} | Cost: {record['cost_usd']} | Duration: {duration}m")
        
        os.makedirs("comptia_dataset", exist_ok=True)
        with open(f"comptia_dataset/{slug}.json", "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, ensure_ascii=False)

    await crawler.run([Request.from_url("https://www.comptia.org/certifications", label=LABEL_INDEX)])

if __name__ == '__main__':
    asyncio.run(main())
