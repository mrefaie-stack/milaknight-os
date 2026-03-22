const { Client } = require('ssh2');

const testScript = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const conn = await prisma.socialConnection.findFirst({
        where: { platform: 'FACEBOOK', isActive: true }
    });
    const meta = JSON.parse(conn.metadata || '{}');
    const pageId = meta.pageId;
    const pt = conn.accessToken;
    const since = '2026-03-01';
    const until = '2026-03-22';

    const pageRes = await fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=access_token,instagram_business_account{id}&access_token=' + pt);
    const pageInfo = await pageRes.json();
    const pageToken = pageInfo.access_token || pt;
    const igId = pageInfo.instagram_business_account?.id;

    // Test: follows_and_unfollows as time-series (no metric_type)
    console.log('=== Test: follows_and_unfollows as time-series (period=day, no metric_type) ===');
    const url = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=follows_and_unfollows&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const r = await fetch(url);
    const d = await r.json();
    if (d.error) {
        console.log('FAILED:', d.error.message);
    } else {
        console.log('Raw:', JSON.stringify(d, null, 2));
    }

    // Test: profile_links_taps (the actual "link in bio" taps metric)
    console.log('\\n=== Test: profile_links_taps (total_value) ===');
    const url2 = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=profile_links_taps&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const r2 = await fetch(url2);
    const d2 = await r2.json();
    if (d2.error) {
        console.log('FAILED:', d2.error.message);
    } else {
        console.log('Raw:', JSON.stringify(d2.data?.[0], null, 2));
    }

    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/test_ig_follows2.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_ig_follows2.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
