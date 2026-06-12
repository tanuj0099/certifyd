import re
import sys

def main():
    file_path = 'c:/Users/Tanuj Rajdev/Downloads/certifyroi/certifyroi/certifyd-scraper/main.py'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace AWS
    content = re.sub(
        r'("cost":\s*)int\(cost\) if cost\.isdigit\(\) else 0,',
        r'"cost_usd": float(cost) if str(cost).isdigit() else 0.0,\n            "cost_inr": round((float(cost) if str(cost).isdigit() else 0.0) * LIVE_USD_TO_INR, 2),',
        content
    )

    # Replace the one-liners for GCP, Cisco, CompTIA, OffSec, LPI
    content = re.sub(
        r'"cost":\s*int\(cost\)',
        r'"cost_usd": float(cost), "cost_inr": round(float(cost) * LIVE_USD_TO_INR, 2)',
        content
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Replacements successful.")

if __name__ == "__main__":
    main()
