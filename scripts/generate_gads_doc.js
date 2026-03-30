const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 48px; font-size: 13px; line-height: 1.6; }

  .cover { text-align: center; padding: 60px 0 40px; border-bottom: 3px solid #4285F4; margin-bottom: 40px; }
  .logo-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px; }
  .logo-box { background: #4285F4; color: #fff; font-weight: 900; font-size: 22px; width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .cover h1 { font-size: 28px; font-weight: 800; color: #1a1a2e; }
  .cover h2 { font-size: 16px; font-weight: 400; color: #5f6368; margin-top: 6px; }
  .meta { display: flex; justify-content: center; gap: 40px; margin-top: 24px; }
  .meta-item { text-align: center; }
  .meta-item .label { font-size: 11px; color: #9aa0a6; text-transform: uppercase; letter-spacing: .5px; }
  .meta-item .value { font-size: 13px; font-weight: 600; color: #1a1a2e; margin-top: 2px; }

  h3 { font-size: 15px; font-weight: 700; color: #4285F4; border-left: 4px solid #4285F4; padding-left: 10px; margin: 32px 0 12px; }
  p { margin-bottom: 10px; color: #3c4043; }

  .card { background: #f8f9fa; border: 1px solid #e8eaed; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
  .card-title { font-weight: 700; font-size: 13px; color: #1a1a2e; margin-bottom: 6px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #4285F4; color: #fff; padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #e8eaed; font-size: 12px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8f9fa; }

  .flow { display: flex; gap: 0; margin: 16px 0; flex-wrap: wrap; }
  .flow-step { background: #e8f0fe; border: 1px solid #c5d8fd; border-radius: 8px; padding: 10px 14px; font-size: 12px; flex: 1; min-width: 120px; margin: 4px; text-align: center; }
  .flow-step strong { display: block; color: #4285F4; font-size: 13px; margin-bottom: 4px; }
  .arrow { display: flex; align-items: center; color: #9aa0a6; font-size: 18px; padding: 0 4px; }

  .scope-badge { display: inline-block; background: #e6f4ea; color: #137333; border: 1px solid #ceead6; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-family: monospace; margin: 2px; }
  .endpoint-badge { display: inline-block; background: #fce8e6; color: #c5221f; border: 1px solid #f5c6c5; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-family: monospace; margin: 2px; }

  .highlight { background: #e8f0fe; border-left: 3px solid #4285F4; padding: 10px 14px; border-radius: 0 6px 6px 0; margin: 10px 0; font-size: 12px; color: #1967d2; }

  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e8eaed; text-align: center; font-size: 11px; color: #9aa0a6; }
</style>
</head>
<body>

<div class="cover">
  <div class="logo-row">
    <div class="logo-box">MK</div>
    <div style="text-align:left">
      <div style="font-weight:800;font-size:20px">MilaKnight OS</div>
      <div style="color:#5f6368;font-size:13px">Digital Marketing Intelligence Platform</div>
    </div>
  </div>
  <h1>Google Ads API — Design Documentation</h1>
  <h2>Standard Access Token Application</h2>
  <div class="meta">
    <div class="meta-item"><div class="label">Company</div><div class="value">MilaKnight</div></div>
    <div class="meta-item"><div class="label">Platform</div><div class="value">os.mila-knight.com</div></div>
    <div class="meta-item"><div class="label">Document Date</div><div class="value">March 2026</div></div>
    <div class="meta-item"><div class="label">Version</div><div class="value">1.0</div></div>
  </div>
</div>

<!-- 1. Company Overview -->
<h3>1. Company Overview</h3>
<p><strong>MilaKnight</strong> is a full-service digital marketing agency that manages advertising campaigns and social media presence for a portfolio of business clients across Saudi Arabia. The agency provides end-to-end services including paid ads management (Meta, Google Ads, Snapchat, TikTok), content creation, SEO, and monthly performance reporting.</p>
<p>To serve our clients more effectively, we have built <strong>MilaKnight OS</strong> — a proprietary SaaS-style internal platform hosted at <strong>os.mila-knight.com</strong>. This platform centralizes all client data, campaign performance, action plans, and automated reporting in one place.</p>

<!-- 2. Tool Description -->
<h3>2. Tool Description — MilaKnight OS</h3>
<div class="card">
  <div class="card-title">What the tool does</div>
  <p>MilaKnight OS connects to each client's Google Ads account via OAuth 2.0 and uses the Google Ads API to retrieve their campaign performance data. This data is displayed in a real-time live dashboard and used to generate automated monthly performance reports — replacing manual exports and spreadsheets.</p>
</div>

<table>
  <tr><th>Feature</th><th>Description</th></tr>
  <tr><td>Live Dashboard</td><td>Displays real-time Google Ads campaign stats per client: impressions, clicks, cost, conversions, CTR, CPC, conversion rate</td></tr>
  <tr><td>Campaign List</td><td>Shows all active and paused campaigns with individual performance metrics</td></tr>
  <tr><td>Auto-Report Generation</td><td>Account managers select a client + month and the system automatically pulls Google Ads data and generates a bilingual (Arabic/English) PDF performance report using AI</td></tr>
  <tr><td>Per-Client Isolation</td><td>Each client authenticates with their own Google account. Data is stored and displayed in complete isolation — no cross-client data access</td></tr>
  <tr><td>Token Management</td><td>OAuth 2.0 refresh tokens are stored securely per client and automatically refreshed before expiry</td></tr>
</table>

<!-- 3. Authentication Flow -->
<h3>3. Authentication & Authorization Flow (Per Client)</h3>
<div class="flow">
  <div class="flow-step"><strong>Step 1</strong>Client logs into MilaKnight OS</div>
  <div class="flow-step"><strong>Step 2</strong>Clicks "Connect Google" on their connections page</div>
  <div class="flow-step"><strong>Step 3</strong>OAuth 2.0 PKCE flow → Google consent screen</div>
  <div class="flow-step"><strong>Step 4</strong>Client grants permission on their own Google account</div>
  <div class="flow-step"><strong>Step 5</strong>Tokens saved to DB linked to that client's ID only</div>
  <div class="flow-step"><strong>Step 6</strong>Dashboard and reports pull data using that client's token</div>
</div>

<div class="highlight">
  ⚠️ Each client connects their own Google Ads account. The agency (MilaKnight) does not use a single shared token — every client's data is accessed exclusively through their own OAuth token tied to their account.
</div>

<!-- 4. OAuth Scopes -->
<h3>4. OAuth Scopes Requested</h3>
<table>
  <tr><th>Scope</th><th>Purpose</th><th>Data Accessed</th></tr>
  <tr>
    <td><span class="scope-badge">https://www.googleapis.com/auth/adwords</span></td>
    <td>Google Ads API access</td>
    <td>Campaign stats: impressions, clicks, cost_micros, conversions, CTR, CPC — read only</td>
  </tr>
  <tr>
    <td><span class="scope-badge">https://www.googleapis.com/auth/youtube.readonly</span></td>
    <td>YouTube channel stats</td>
    <td>Subscribers, total views, video count — read only</td>
  </tr>
  <tr>
    <td><span class="scope-badge">https://www.googleapis.com/auth/yt-analytics.readonly</span></td>
    <td>YouTube Analytics</td>
    <td>Period-specific views, watch time, new subscribers — read only</td>
  </tr>
</table>
<p style="color:#5f6368;font-size:12px">All data access is <strong>read-only</strong>. The tool does not create, modify, or delete any campaigns, ads, budgets, or billing information.</p>

<!-- 5. Google Ads API Endpoints -->
<h3>5. Google Ads API Endpoints Used</h3>
<table>
  <tr><th>Endpoint</th><th>Method</th><th>Purpose</th></tr>
  <tr>
    <td><span class="endpoint-badge">customers:listAccessibleCustomers</span></td>
    <td>GET</td>
    <td>List Google Ads customer accounts accessible to the authenticated user</td>
  </tr>
  <tr>
    <td><span class="endpoint-badge">customers/{id}/googleAds:search</span></td>
    <td>POST</td>
    <td>GAQL query to fetch campaign-level stats (impressions, clicks, cost, conversions) for a date range</td>
  </tr>
</table>

<p><strong>Sample GAQL Query used:</strong></p>
<div class="card" style="font-family:monospace;font-size:11px;color:#c5221f;background:#fff8f7;border-color:#f5c6c5">
SELECT campaign.id, campaign.name, campaign.status,<br>
&nbsp;&nbsp;metrics.impressions, metrics.clicks, metrics.cost_micros,<br>
&nbsp;&nbsp;metrics.conversions, metrics.ctr, metrics.average_cpc<br>
FROM campaign<br>
WHERE segments.date BETWEEN '2026-01-01' AND '2026-01-31'<br>
ORDER BY metrics.impressions DESC LIMIT 20
</div>

<!-- 6. Data Usage -->
<h3>6. Data Storage & Usage Policy</h3>
<table>
  <tr><th>Data Type</th><th>Stored?</th><th>Purpose</th></tr>
  <tr><td>OAuth access token</td><td>Yes — encrypted in DB</td><td>Used to authenticate API requests on behalf of the client</td></tr>
  <tr><td>OAuth refresh token</td><td>Yes — encrypted in DB</td><td>Used to obtain new access tokens before expiry</td></tr>
  <tr><td>Campaign metrics</td><td>No — fetched live</td><td>Fetched fresh on each dashboard load and report generation; not persisted</td></tr>
  <tr><td>Report snapshots</td><td>Yes — in DB</td><td>Monthly report metrics stored as JSON for historical comparison (MoM analysis)</td></tr>
</table>
<p>Campaign data is <strong>never shared between clients</strong>, never sold, and never used for any purpose other than displaying it to the account owner and their designated account manager.</p>

<!-- 7. Users -->
<h3>7. Who Has Access to the Tool</h3>
<div class="card">
  <div class="card-title">Internal Users (MilaKnight Team)</div>
  <p>Account Managers log in to view their assigned clients' dashboards, generate automated monthly reports, and review campaign performance. They cannot see data for clients not assigned to them.</p>
</div>
<div class="card">
  <div class="card-title">External Users (Clients)</div>
  <p>Each business client logs into their own portal, connects their Google account, and views only their own data. They receive auto-generated monthly PDF reports.</p>
</div>

<!-- 8. Platform Architecture -->
<h3>8. Platform Architecture</h3>
<table>
  <tr><th>Component</th><th>Technology</th></tr>
  <tr><td>Frontend</td><td>Next.js 16 (React) — server-side rendered</td></tr>
  <tr><td>Backend / API</td><td>Next.js API Routes (Node.js)</td></tr>
  <tr><td>Database</td><td>PostgreSQL (via Prisma ORM)</td></tr>
  <tr><td>Hosting</td><td>Ubuntu VPS — os.mila-knight.com</td></tr>
  <tr><td>Auth</td><td>NextAuth.js + custom OAuth 2.0 PKCE flows per platform</td></tr>
  <tr><td>Token Security</td><td>Tokens stored server-side in database, never exposed to frontend</td></tr>
</table>

<!-- 9. Compliance -->
<h3>9. Compliance & Policy Adherence</h3>
<p>MilaKnight OS is built in full compliance with Google Ads API Terms of Service:</p>
<div class="card">
  ✅ &nbsp;Read-only access — no campaign creation, modification, or deletion<br><br>
  ✅ &nbsp;Per-client OAuth — no shared credentials across clients<br><br>
  ✅ &nbsp;No data reselling — campaign data is used exclusively for the client's own reporting<br><br>
  ✅ &nbsp;Secure token storage — tokens are server-side only, never exposed to the browser<br><br>
  ✅ &nbsp;Standard rate limiting — API calls are made only when a user loads their dashboard or generates a report<br><br>
  ✅ &nbsp;No App Conversion Tracking or Remarketing API usage
</div>

<div class="footer">
  MilaKnight | os.mila-knight.com | Digital Marketing Agency — Saudi Arabia<br>
  This document is prepared for Google Ads API Standard Access application review.
</div>

</body>
</html>`;

// Save HTML to temp
const tmpHtml = path.join(os.tmpdir(), 'milaknight_gads_doc.html');
fs.writeFileSync(tmpHtml, html, 'utf8');
console.log('HTML written to:', tmpHtml);

// Desktop path
const desktop = path.join(os.homedir(), 'Desktop', 'MilaKnight_GoogleAds_API_Documentation.pdf');

// Try Edge headless first, then Chrome
const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

let browserPath = null;
for (const p of edgePaths) {
    if (fs.existsSync(p)) { browserPath = p; break; }
}

if (!browserPath) {
    console.error('Edge/Chrome not found. Please open the HTML file in a browser and print to PDF:');
    console.log('File:', tmpHtml);
    process.exit(1);
}

console.log('Using browser:', browserPath);
console.log('Generating PDF...');

try {
    execSync(`"${browserPath}" --headless=new --disable-gpu --print-to-pdf="${desktop}" --print-to-pdf-no-header "file:///${tmpHtml.replace(/\\/g,'/')}"`, { stdio: 'inherit' });
    console.log('\n✅ PDF saved to Desktop:', desktop);
} catch (e) {
    // Fallback: older headless flag
    try {
        execSync(`"${browserPath}" --headless --disable-gpu --print-to-pdf="${desktop}" "file:///${tmpHtml.replace(/\\/g,'/')}"`, { stdio: 'inherit' });
        console.log('\n✅ PDF saved to Desktop:', desktop);
    } catch (e2) {
        console.error('PDF generation failed. Open this file in browser and print to PDF:');
        console.log(tmpHtml);
    }
}
