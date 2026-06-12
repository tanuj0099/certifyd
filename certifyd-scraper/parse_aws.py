import re
import json

def parse_index():
    with open('aws_index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    links = set(re.findall(r'href=[\'\"](.*?/certification/certified-[\w-]+/?)[\'\"]', html))
    valid_links = []
    for link in links:
        if not link.startswith('http'):
            link = 'https://aws.amazon.com' + link
        valid_links.append(link)

    print('Found AWS Cert Links:', len(valid_links))
    print('Sample links:', valid_links[:5])

def parse_detail():
    with open('aws_detail.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Title
    title_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL | re.IGNORECASE)
    title = title_match.group(1).strip() if title_match else ""
    
    # Overview/Description
    print('Title:', re.sub(r'<[^>]+>', '', title).strip())

parse_index()
parse_detail()
