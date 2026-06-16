with open('src/components/DynamicIslandNav.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the logo image with an inline SVG
# Option A: Three rounded bars, slightly offset

logo_svg = '''
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="10" width="5" height="12" rx="2.5" fill="var(--text)" />
                  <rect x="9" y="4" width="5" height="18" rx="2.5" fill="var(--text)" />
                  <rect x="16" y="8" width="5" height="14" rx="2.5" fill="#00E5A8" />
                </svg>
              </div>
'''

content = content.replace(
    '<img src="/logo.svg" alt="Certifyd Logo" style={{ height: \'32px\', width: \'auto\' }} />',
    logo_svg
)

# Replace the playfair class with Geist
content = content.replace(
    '<span className={${playfair.className} text-2xl font-black tracking-tight}>Certifyd.in</span>',
    '<span style={{ fontFamily: \'"Geist", "Satoshi", "Inter", sans-serif\', fontSize: \'1.25rem\', fontWeight: \'800\', letterSpacing: \'-0.02em\' }}>Certifyd.in</span>'
)

with open('src/components/DynamicIslandNav.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated DynamicIslandNav.jsx successfully.")
