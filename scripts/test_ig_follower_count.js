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

    const pageRes = await fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=access_token,instagram_business_account{id,followers_count}&access_token=' + pt);
    const pageInfo = await pageRes.json();
    const pageToken = pageInfo.access_token || pt;
    const igId = pageInfo.instagram_business_account?.id;
    const currentFollowers = pageInfo.instagram_business_account?.followers_count;
    console.log('Current followers:', currentFollowers);

    // Try follower_count as time-series (period=day)
    console.log('\\n--- follower_count time-series ---');
    const url1 = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=follower_count&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const r1 = await fetch(url1);
    const d1 = await r1.json();
    if (d1.error) {
        console.log('FAILED:', d1.error.message);
    } else {
        const item = d1.data?.[0];
        if (item?.values?.length) {
            const first = item.values[0].value;
            const last = item.values[item.values.length - 1].value;
            console.log('Days with data:', item.values.length);
            console.log('First day value:', first, 'on', item.values[0].end_time);
            console.log('Last day value:', last, 'on', item.values[item.values.length - 1].end_time);
            console.log('Net change (last - first):', last - first);
        } else {
            console.log('Raw:', JSON.stringify(d1.data?.[0], null, 2));
        }
    }

    // Try follower_count with total_value
    console.log('\\n--- follower_count total_value ---');
    const url2 = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=follower_count&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const r2 = await fetch(url2);
    const d2 = await r2.json();
    if (d2.error) {
        console.log('FAILED:', d2.error.message);
    } else {
        console.log('total_value:', JSON.stringify(d2.data?.[0]?.total_value));
    }

    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/test_ig_fc.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_ig_fc.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
