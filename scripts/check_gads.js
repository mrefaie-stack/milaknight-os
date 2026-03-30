const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat > /tmp/gads2.mjs << 'EOF'
import { PrismaClient } from '/root/milaknight-os/node_modules/@prisma/client/index.js';
const p = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const r = await p.socialConnection.findFirst({ where: { platform: 'GOOGLE_ADS', isActive: true }, select: { accessToken: true, refreshToken: true, metadata: true, expiresAt: true } });
if (!r) { console.log('NOT FOUND'); await p.$disconnect(); process.exit(0); }

const token = r.accessToken;
const dev = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const cid = '3722814899';

console.log('=== Test 1: No developer-token header ===');
const r1 = await fetch('https://googleads.googleapis.com/v19/customers:listAccessibleCustomers', {
  headers: { Authorization: 'Bearer ' + token }
});
console.log('Status:', r1.status, (await r1.text()).slice(0, 300));

console.log('=== Test 2: With developer-token, v19 search ===');
const r2 = await fetch('https://googleads.googleapis.com/v19/customers/' + cid + '/googleAds:search', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'developer-token': dev, 'Content-Type': 'application/json', 'login-customer-id': cid },
  body: JSON.stringify({ query: 'SELECT customer.id FROM customer LIMIT 1' })
});
console.log('Status:', r2.status, (await r2.text()).slice(0, 500));

console.log('=== Test 3: Try v20 ===');
const r3 = await fetch('https://googleads.googleapis.com/v20/customers/' + cid + '/googleAds:search', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'developer-token': dev, 'Content-Type': 'application/json', 'login-customer-id': cid },
  body: JSON.stringify({ query: 'SELECT customer.id FROM customer LIMIT 1' })
});
console.log('Status:', r3.status, (await r3.text()).slice(0, 500));

console.log('=== Test 4: Refresh token and retry ===');
const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: r.refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET
  })
});
const refreshData = await refreshRes.json();
console.log('Refresh status:', refreshRes.status, 'new_token:', refreshData.access_token ? 'YES' : JSON.stringify(refreshData));
if (refreshData.access_token) {
  const r4 = await fetch('https://googleads.googleapis.com/v19/customers/' + cid + '/googleAds:search', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + refreshData.access_token, 'developer-token': dev, 'Content-Type': 'application/json', 'login-customer-id': cid },
    body: JSON.stringify({ query: 'SELECT customer.id FROM customer LIMIT 1' })
  });
  console.log('After refresh - Status:', r4.status, (await r4.text()).slice(0, 500));
}
await p.$disconnect();
EOF
cd /root/milaknight-os && node --input-type=module --env-file=.env < /tmp/gads2.mjs`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
