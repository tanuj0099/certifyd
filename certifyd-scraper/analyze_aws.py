import re
import json

with open('aws_detail.html', 'r', encoding='utf-8') as f:
    html = f.read()

def get_tag_text(tag, html):
    matches = re.findall(f'<{tag}[^>]*>(.*?)</{tag}>', html, re.DOTALL | re.IGNORECASE)
    return [re.sub(r'<[^>]+>', '', m).strip() for m in matches if m.strip()]

print("H1s:", get_tag_text('h1', html))
print("H2s:", get_tag_text('h2', html)[:10])
print("H3s:", get_tag_text('h3', html)[:10])

cost_matches = re.findall(r'(\d+)\s*USD', html)
print("Cost:", cost_matches)

level_matches = re.findall(r'(Foundational|Associate|Professional|Specialty)', html)
print("Level:", list(set(level_matches)))

print("Minutes:", re.findall(r'(\d+)\s*minutes', html))
print("Questions:", re.findall(r'(\d+)\s*questions', html))

