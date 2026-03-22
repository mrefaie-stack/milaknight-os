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
    const pageToken = (await pageRes.json()).access_token || pt;

    // Try all page metrics from Meta docs 2024/2025
    const allMetrics = [
        'page_impressions', 'page_impressions_unique',
        'page_views_total', 'page_views_logged_in_total', 'page_views_external_referrals',
        'page_post_engagements', 'page_actions_post_reactions_total',
        'page_fan_adds', 'page_fan_adds_unique', 'page_fan_adds_by_paid_non_paid_unique',
        'page_follows', 'page_fans',
        'page_reach', 'page_uniq_impressions',
        'page_content_reach', 'page_content_reach_unique',
        'page_engaged_users', 'page_consumptions', 'page_consumptions_unique',
        'page_places_checkin_total', 'page_negative_feedback',
        'page_engaged_users', 'page_impressions_paid', 'page_impressions_organic',
        'page_impressions_paid_unique', 'page_impressions_organic_unique',
        'page_video_views', 'page_video_views_unique',
        'page_stories_by_story_type',
    ];

    const working = [];
    const failed = [];

    for (const metric of allMetrics) {
        const url = 'https://graph.facebook.com/v19.0/' + pageId + '/insights?metric=' + metric + '&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
        const r = await fetch(url);
        const d = await r.json();
        if (d.error) {
            failed.push(metric);
        } else {
            const total = (d.data?.[0]?.values || []).reduce((s, v) => s + (Number(v.value) || 0), 0);
            working.push({ metric, total });
            console.log('✓ ' + metric + ' = ' + total);
        }
    }

    console.log('\\n=== WORKING METRICS (' + working.length + ') ===');
    working.forEach(m => console.log('  ' + m.metric + ' = ' + m.total));
    console.log('\\nFailed (' + failed.length + '):', failed.join(', '));

    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/debug_fb3.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/debug_fb3.js 2>&1', (err2, s) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                s.on('data', d => process.stdout.write(d.toString()));
                s.stderr.on('data', d => process.stderr.write(d.toString()));
                s.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
