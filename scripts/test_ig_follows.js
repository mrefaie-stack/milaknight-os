const { Client } = require('ssh2');

const testScript = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const conn = await prisma.socialConnection.findFirst({
        where: { platform: 'FACEBOOK', isActive: true }
    });
    if (!conn) { console.log('No FB connection'); process.exit(1); }

    const meta = JSON.parse(conn.metadata || '{}');
    const pageId = meta.pageId;
    if (!pageId) { console.log('No pageId'); process.exit(1); }

    const pt = conn.accessToken; // user token
    const since = '2026-03-01';
    const until = '2026-03-22';

    // Get page token
    const pageRes = await fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=name,access_token,instagram_business_account{id,followers_count}&access_token=' + pt);
    const pageInfo = await pageRes.json();
    const pageToken = pageInfo.access_token || pt;
    const igId = pageInfo.instagram_business_account?.id;
    console.log('Page:', pageInfo.name, '| IG id:', igId, '| IG followers:', pageInfo.instagram_business_account?.followers_count);

    if (!igId) { console.log('No IG account'); process.exit(1); }

    // Test 1: All metrics together with metric_type=total_value
    console.log('\\n=== Test 1: All metrics together (total_value) ===');
    const url1 = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=reach,views,total_interactions,website_clicks,profile_views,follows_and_unfollows&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const r1 = await fetch(url1);
    const d1 = await r1.json();
    if (d1.error) {
        console.log('FAILED:', d1.error.message);
    } else {
        (d1.data || []).forEach(m => {
            console.log('Metric:', m.name, '| total_value:', JSON.stringify(m.total_value));
        });
    }

    // Test 2: follows_and_unfollows alone
    console.log('\\n=== Test 2: follows_and_unfollows alone ===');
    const url2 = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=follows_and_unfollows&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const r2 = await fetch(url2);
    const d2 = await r2.json();
    if (d2.error) {
        console.log('FAILED:', d2.error.message);
    } else {
        console.log('Raw response:', JSON.stringify(d2, null, 2));
    }

    // Test 3: website_clicks alone
    console.log('\\n=== Test 3: website_clicks alone ===');
    const url3 = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=website_clicks&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const r3 = await fetch(url3);
    const d3 = await r3.json();
    if (d3.error) {
        console.log('FAILED:', d3.error.message);
    } else {
        console.log('Raw response:', JSON.stringify(d3, null, 2));
    }

    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/test_ig_follows.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_ig_follows.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
