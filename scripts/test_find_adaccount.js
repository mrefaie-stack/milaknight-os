const { Client } = require('ssh2');

const testScript = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const conn = await prisma.socialConnection.findFirst({ where: { platform: 'FACEBOOK', isActive: true } });
    const pt = conn.accessToken;
    const meta = JSON.parse(conn.metadata || '{}');
    const pageId = meta.pageId;
    const since = '2026-03-01';
    const until = '2026-03-22';
    console.log('Looking for ad account for pageId:', pageId);

    // Method 1: Get ad accounts that own/use this page via page API
    console.log('\\n=== Method 1: page->ad_accounts ===');
    const r1 = await fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=ad_campaign&access_token=' + pt);
    const d1 = await r1.json();
    console.log('page ad_campaign:', JSON.stringify(d1.ad_campaign || d1.error));

    // Method 2: Search ad accounts with instagram_business_account matching
    console.log('\\n=== Method 2: ad accounts with matching IG account ===');
    const r2 = await fetch('https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,instagram_business_accounts&limit=50&access_token=' + pt);
    const d2 = await r2.json();
    for (const aa of d2.data || []) {
        const igAccounts = aa.instagram_business_accounts?.data || [];
        const match = igAccounts.find(ig => ig.id === '17841400166971388');
        if (match) {
            console.log('MATCH FOUND:', aa.name, '| account_id:', aa.account_id, '| act_id:', aa.id);
        }
    }

    // Method 3: Check which ad account promoted the page
    console.log('\\n=== Method 3: find by page_id in promoted_object ===');
    // Get all ad accounts with spend in this period - check each quickly
    const r3 = await fetch('https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id&limit=50&access_token=' + pt);
    const d3 = await r3.json();

    for (const aa of d3.data || []) {
        // Quick check: get one campaign that promotes this page
        const campUrl = 'https://graph.facebook.com/v19.0/' + aa.id + '/campaigns?fields=promoted_object&filtering=' +
            encodeURIComponent('[{"field":"promoted_object.page_id","operator":"EQUAL","value":"' + pageId + '"}]') +
            '&limit=1&access_token=' + pt;
        const cr = await fetch(campUrl);
        const cd = await cr.json();
        if (!cd.error && (cd.data || []).length > 0) {
            console.log('PAGE MATCH:', aa.name, '| account_id:', aa.account_id);
        }
    }

    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/test_find_aa.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_find_aa.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
