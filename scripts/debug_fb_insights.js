const { Client } = require('ssh2');

const testScript = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const conn = await prisma.socialConnection.findFirst({ where: { platform: 'FACEBOOK', isActive: true, clientId: { not: null } } });
    const pt = conn.accessToken;
    const meta = JSON.parse(conn.metadata || '{}');
    const pageId = meta.pageId;
    const since = '2026-03-01';
    const until = '2026-03-22';

    console.log('pageId:', pageId);
    console.log('token length:', pt?.length);

    // Step 1: Get page info + page token
    console.log('\\n=== STEP 1: Get page info & page token ===');
    const pageRes = await fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=name,fan_count,access_token&access_token=' + pt);
    const pageInfo = await pageRes.json();
    if (pageInfo.error) { console.log('pageInfo ERROR:', pageInfo.error.message); }
    else { console.log('name:', pageInfo.name, '| fan_count:', pageInfo.fan_count, '| page_token:', pageInfo.access_token ? 'GOT IT (len=' + pageInfo.access_token.length + ')' : 'MISSING'); }

    const pageToken = pageInfo.access_token || pt;

    // Step 2: Check what permissions this token has
    console.log('\\n=== STEP 2: Token debug info ===');
    const debugRes = await fetch('https://graph.facebook.com/debug_token?input_token=' + pageToken + '&access_token=' + pt);
    const debugInfo = await debugRes.json();
    if (debugInfo.error) { console.log('debug_token ERROR:', debugInfo.error.message); }
    else {
        const d = debugInfo.data;
        console.log('type:', d?.type, '| app_id:', d?.app_id);
        console.log('scopes:', (d?.scopes || []).join(', '));
        const hasPRE = (d?.scopes || []).includes('pages_read_engagement');
        const hasPSI = (d?.scopes || []).includes('pages_show_list');
        console.log('pages_read_engagement:', hasPRE ? 'YES ✓' : 'NO ✗');
        console.log('pages_show_list:', hasPSI ? 'YES ✓' : 'NO ✗');
    }

    // Step 3: Try each metric individually
    console.log('\\n=== STEP 3: Test each FB page metric individually ===');
    const metrics = ['page_impressions', 'page_impressions_unique', 'page_post_engagements', 'page_views_total', 'page_fan_adds'];
    for (const metric of metrics) {
        const url = 'https://graph.facebook.com/v19.0/' + pageId + '/insights?metric=' + metric + '&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
        const r = await fetch(url);
        const d = await r.json();
        if (d.error) {
            console.log(metric + ': ERROR - ' + d.error.message.substring(0, 100));
        } else {
            const total = (d.data?.[0]?.values || []).reduce((s, v) => s + (Number(v.value) || 0), 0);
            console.log(metric + ': OK = ' + total);
        }
    }

    // Step 4: Try with USER token instead of page token
    console.log('\\n=== STEP 4: Try with USER token (not page token) ===');
    for (const metric of ['page_impressions', 'page_post_engagements']) {
        const url = 'https://graph.facebook.com/v19.0/' + pageId + '/insights?metric=' + metric + '&period=day&since=' + since + '&until=' + until + '&access_token=' + pt;
        const r = await fetch(url);
        const d = await r.json();
        if (d.error) {
            console.log(metric + ' (user token): ERROR - ' + d.error.message.substring(0, 100));
        } else {
            const total = (d.data?.[0]?.values || []).reduce((s, v) => s + (Number(v.value) || 0), 0);
            console.log(metric + ' (user token): OK = ' + total);
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
        const stream = sftp.createWriteStream('/tmp/debug_fb.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/debug_fb.js 2>&1', (err2, s) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                s.on('data', d => process.stdout.write(d.toString()));
                s.stderr.on('data', d => process.stderr.write(d.toString()));
                s.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
