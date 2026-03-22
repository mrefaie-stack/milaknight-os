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

    // Try v21 for page token
    const pageRes = await fetch('https://graph.facebook.com/v21.0/' + pageId + '?fields=access_token,instagram_business_account{id}&access_token=' + pt);
    const pageInfo = await pageRes.json();
    const pageToken = pageInfo.access_token || pt;
    const igId = pageInfo.instagram_business_account?.id;

    // Try follows_and_unfollows with v21
    for (const v of ['v19.0', 'v21.0', 'v22.0']) {
        console.log('\\n--- ' + v + ' follows_and_unfollows ---');
        const url = 'https://graph.facebook.com/' + v + '/' + igId + '/insights?metric=follows_and_unfollows&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
        const r = await fetch(url);
        const d = await r.json();
        if (d.error) {
            console.log('FAILED:', d.error.message);
        } else {
            const item = d.data?.[0];
            console.log('total_value:', JSON.stringify(item?.total_value));
            if (item?.total_value?.breakdowns) {
                console.log('breakdowns:', JSON.stringify(item.total_value.breakdowns));
            }
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
        const stream = sftp.createWriteStream('/tmp/test_ig_v21.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_ig_v21.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
