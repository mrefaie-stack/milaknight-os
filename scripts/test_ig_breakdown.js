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

    const tests = [
        // 1. With breakdown=follow_type
        { label: 'follows_and_unfollows + breakdown=follow_type', url: 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=follows_and_unfollows&metric_type=total_value&period=day&breakdown=follow_type&since=' + since + '&until=' + until + '&access_token=' + pageToken },
        // 2. With breakdown parameter as the metric field syntax
        { label: 'follows_and_unfollows + breakdowns[]=follow_type', url: 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=follows_and_unfollows&metric_type=total_value&period=day&breakdowns%5B%5D=follow_type&since=' + since + '&until=' + until + '&access_token=' + pageToken },
        // 3. Try net_follower_count (if it exists)
        { label: 'net_follower_count', url: 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=net_follower_count&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken },
        // 4. follower_count time series without date range
        { label: 'follower_count no date range', url: 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=follower_count&period=day&access_token=' + pageToken },
        // 5. Try IG user fields endpoint for follower history
        { label: 'IG user insights field on page', url: 'https://graph.facebook.com/v19.0/' + igId + '?fields=followers_count,media_count,name&access_token=' + pageToken },
        // 6. Try accounts_engaged
        { label: 'accounts_engaged', url: 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=accounts_engaged&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken },
    ];

    for (const t of tests) {
        console.log('\\n=== ' + t.label + ' ===');
        try {
            const r = await fetch(t.url);
            const d = await r.json();
            if (d.error) {
                console.log('ERROR:', d.error.message);
            } else {
                const item = d.data?.[0];
                if (item) {
                    console.log('total_value:', JSON.stringify(item.total_value));
                    if (item.values) console.log('values sample:', JSON.stringify(item.values?.slice(-3)));
                    if (item.followers_count !== undefined) console.log('followers_count:', item.followers_count);
                    if (item.name) console.log('name:', item.name);
                } else {
                    // Non-array response
                    const keys = Object.keys(d).filter(k => k !== 'paging');
                    for (const k of keys) console.log(k + ':', JSON.stringify(d[k]));
                }
            }
        } catch(e) { console.log('FETCH ERROR:', e.message); }
    }

    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/test_ig_bd.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_ig_bd.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
