import http from 'node:http';

const ROUTES = [
  '/',
  '/tools',
  '/tools/roi',
  '/tools/cert-radar',
  '/tools/market',
  '/tools/compare',
  '/tools/resume',
  '/tools/simulator',
  '/tools/hike',
  '/tools/heatmap',
  '/tools/jobmap',
  '/tools/college',
  '/tools/quick-check',
  '/offer-analysis',
  '/pricing',
  '/blog',
  '/faq',
  '/about',
  '/contact',
  '/trust',
  '/terms',
  '/privacy',
  '/cookies',
  '/user-profile'
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(`http://localhost:3000${route}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        const is200 = res.statusCode === 200;
        const hasTitle = data.includes('<title>') || data.includes('Certifyd');
        resolve({
          route,
          status: res.statusCode,
          duration,
          success: is200 && hasTitle,
          error: !is200 ? `Status ${res.statusCode}` : (!hasTitle ? 'Missing expected title/content' : null)
        });
      });
    });
    req.on('error', (err) => {
      resolve({ route, status: 'ERROR', duration: Date.now() - start, success: false, error: err.message });
    });
    req.setTimeout(35000, () => {
      req.destroy();
      resolve({ route, status: 'TIMEOUT', duration: Date.now() - start, success: false, error: 'Request timed out' });
    });
  });
}

async function runAll() {
  console.log('=== VERIFYING ALL 24 APPLICATION ROUTES ON http://localhost:3000 ===\n');
  let failures = 0;
  for (const route of ROUTES) {
    const result = await checkRoute(route);
    if (result.success) {
      console.log(`  ✔ [${result.status}] ${result.route.padEnd(24)} (${result.duration}ms)`);
    } else {
      console.log(`  ✖ [${result.status}] ${result.route.padEnd(24)} -> ERROR: ${result.error}`);
      failures++;
    }
  }
  console.log(`\nVerification Complete: ${ROUTES.length - failures}/${ROUTES.length} routes responded 200 OK.`);
  if (failures > 0) {
    process.exit(1);
  }
}

runAll();
