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

    const pageRes = await fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=access_token&access_token=' + pt);
    const pageInfo = await pageRes.json();
    const pageToken = pageInfo.access_token || pt;

    // Test all potential replacements for deprecated metrics
    const candidates = [
        // Views replacements
        'page_impressions_by_story_type',
        'page_daily_total_impressions',
        'page_content_views_logged_in_unique',
        'page_content_views_by_platform_unique',
        // Fan/follow replacements
        'page_follows',
        'page_net_followers_unique',
        'page_fans_adds_unique',
        'page_fan_adds_by_paid_non_paid_unique',
        'page_fan_removes',
        'page_fan_removes_unique',
        // Try newer v21 metric names
        'page_impressions_viral',
        'page_impressions_nonviral',
    ];

    console.log('Testing', candidates.length, 'candidate metrics...\\n');
    for (const metric of candidates) {
        const url = 'https://graph.facebook.com/v19.0/' + pageId + '/insights?metric=' + metric + '&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
        const r = await fetch(url);
        const d = await r.json();
        if (d.error) {
            console.log('✗ ' + metric + ': ' + d.error.message.substring(0, 70));
        } else {
            const total = (d.data?.[0]?.values || []).reduce((s, v) => s + (Number(v.value) || 0), 0);
            console.log('✓ ' + metric + ' = ' + total);
        }
    }

    // Also try v21 / v22
    console.log('\\n=== Testing v22 for page_impressions ===');
    for (const v of ['v19.0', 'v21.0', 'v22.0']) {
        const url = 'https://graph.facebook.com/' + v + '/' + pageId + '/insights?metric=page_impressions&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
        const r = await fetch(url);
        const d = await r.json();
        if (d.error) console.log(v + ' page_impressions: ERROR - ' + d.error.message.substring(0, 80));
        else {
            const total = (d.data?.[0]?.values || []).reduce((s, v) => s + (Number(v.value) || 0), 0);
            console.log(v + ' page_impressions: OK = ' + total);
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
        const stream = sftp.createWriteStream('/tmp/debug_fb2.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/debug_fb2.js 2>&1', (err2, s) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                s.on('data', d => process.stdout.write(d.toString()));
                s.stderr.on('data', d => process.stderr.write(d.toString()));
                s.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
