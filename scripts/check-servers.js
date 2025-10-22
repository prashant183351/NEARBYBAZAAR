#!/usr/bin/env node
/**
 * Pre-E2E Test Server Check
 *
 * Verifies that dev servers are running on expected ports before Playwright tests execute.
 * If servers aren't running, provides helpful instructions.
 *
 * Usage: node scripts/check-servers.js
 */

const http = require('http');

const servers = [
  { name: 'Web PWA', port: 3001, url: 'http://localhost:3001' },
  { name: 'Vendor PWA', port: 3002, url: 'http://localhost:3002' },
  { name: 'Admin PWA', port: 3003, url: 'http://localhost:3003' },
];

async function checkServer(server) {
  return new Promise((resolve) => {
    const req = http.get(server.url, (res) => {
      resolve({ ...server, running: res.statusCode < 500 });
    });
    req.on('error', () => {
      resolve({ ...server, running: false });
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ ...server, running: false });
    });
  });
}

async function main() {
  console.log('🔍 Checking dev servers...\n');

  const results = await Promise.all(servers.map(checkServer));

  const allRunning = results.every((r) => r.running);

  results.forEach((result) => {
    const status = result.running ? '✅' : '❌';
    console.log(
      `${status} ${result.name} (port ${result.port}): ${result.running ? 'Running' : 'Not running'}`,
    );
  });

  if (!allRunning) {
    console.log('\n⚠️  Some servers are not running!');
    console.log('\nTo start all dev servers, run:');
    console.log('  pnpm dev\n');
    console.log('Or start individual apps:');
    console.log('  pnpm --filter @nearbybazaar/web dev');
    console.log('  pnpm --filter @nearbybazaar/vendor dev');
    console.log('  pnpm --filter @nearbybazaar/admin dev\n');
    process.exit(1);
  }

  console.log('\n✅ All servers running! Ready for E2E tests.\n');
  process.exit(0);
}

main();
