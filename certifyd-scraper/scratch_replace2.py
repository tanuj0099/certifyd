import re

def main():
    file_path = 'c:/Users/Tanuj Rajdev/Downloads/certifyroi/certifyroi/certifyd-scraper/main.py'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to replace:
    # cost_inr = float(cost)
    # with:
    # cost_str = re.sub(r'[^\d.]', '', str(cost))
    # cost_inr = float(cost_str) if cost_str else 0.0

    content = re.sub(
        r'cost_inr = float\(cost\)',
        r"cost_str = re.sub(r'[^\d.]', '', str(cost))\n        cost_inr = float(cost_str) if cost_str else 0.0",
        content
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Replacements successful.")

if __name__ == "__main__":
    main()
