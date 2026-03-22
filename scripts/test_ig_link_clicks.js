const { Client } = require('ssh2');

const testScript = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const conn = await prisma.socialConnection.findFirst({ where: { platform: 'FACEBOOK', isActive: true } });
    const meta = JSON.parse(conn.metadata || '{}');
    const pageId = meta.pageId;
    const pt = conn.accessToken;
    const since = '2026-03-01';
    const until = '2026-03-22';

    const pageRes = await fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=access_token,instagram_business_account{id}&access_token=' + pt);
    const pageInfo = await pageRes.json();
    const pageToken = pageInfo.access_token || pt;
    const igId = pageInfo.instagram_business_account?.id;

    // Test every possible link-related metric
    const candidates = [
        'website_clicks',
        'profile_links_taps',
    ];

    for (const metric of candidates) {
        const url = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=' + metric + '&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
        const r = await fetch(url);
        const d = await r.json();
        if (d.error) {
            // Try without total_value
            const url2 = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=' + metric + '&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
            const r2 = await fetch(url2);
            const d2 = await r2.json();
            if (d2.error) {
                console.log(metric + ': ERROR - ' + d2.error.message.substring(0, 80));
            } else {
                const item = d2.data?.[0];
                const total = (item?.values || []).reduce((s, v) => s + (Number(v.value) || 0), 0);
                console.log(metric + ' (time-series): ' + total);
            }
        } else {
            const item = d.data?.[0];
            const val = item?.total_value?.value ?? 'no total_value';
            console.log(metric + ' (total_value): ' + val);
        }
    }

    // Also try getting media-level link clicks from recent posts
    console.log('\\n--- Media-level link_clicks (last 50 posts) ---');
    const mediaUrl = 'https://graph.facebook.com/v19.0/' + igId + '/media?fields=id,timestamp,media_type&limit=50&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const mr = await fetch(mediaUrl);
    const md = await mr.json();
    if (md.error) {
        console.log('Media ERROR:', md.error.message.substring(0, 100));
    } else {
        const mediaItems = md.data || [];
        console.log('Total media in period:', mediaItems.length);
        let totalLinkClicks = 0;
        for (const m of mediaItems.slice(0, 10)) {
            const iurl = 'https://graph.facebook.com/v19.0/' + m.id + '/insights?metric=reach,likes,comments,shares,saved,link_clicks&access_token=' + pageToken;
            const ir = await fetch(iurl);
            const id = await ir.json();
            if (!id.error) {
                const lc = (id.data || []).find(x => x.name === 'link_clicks');
                const lcVal = lc?.values?.[0]?.value || lc?.value || 0;
                if (lcVal > 0) {
                    console.log('  Media ' + m.id + ' (' + m.media_type + ', ' + m.timestamp?.substring(0,10) + '): link_clicks=' + lcVal);
                    totalLinkClicks += lcVal;
                }
            }
        }
        console.log('Total link_clicks from sample (10 posts):', totalLinkClicks);
    }

    // Try story-level link taps
    console.log('\\n--- Story link taps ---');
    const storyUrl = 'https://graph.facebook.com/v19.0/' + igId + '/stories?fields=id,timestamp&access_token=' + pageToken;
    const sr = await fetch(storyUrl);
    const sd = await sr.json();
    if (sd.error) {
        console.log('Stories ERROR:', sd.error.message.substring(0, 100));
    } else {
        console.log('Active stories:', (sd.data || []).length);
    }

    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/test_ig_lc.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_ig_lc.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
