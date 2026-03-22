const { Client } = require('ssh2');

const testScript = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function testPage(conn, label) {
    const meta = conn.metadata ? JSON.parse(conn.metadata) : {};
    const pageId = meta.pageId;
    if (!pageId) { console.log(label, '- no pageId'); return; }

    const infoRes = await fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=name,fan_count,access_token,instagram_business_account{id,followers_count}&access_token=' + conn.accessToken);
    const pageInfo = await infoRes.json();
    console.log('\\n=== ' + label + ' | ' + pageInfo.name + ' | fans=' + pageInfo.fan_count + ' ===');
    if (!pageInfo.access_token) { console.log('No page token!'); return; }
    const pt = pageInfo.access_token;
    const igId = pageInfo.instagram_business_account?.id;

    // Test FB page_impressions
    const r1 = await fetch('https://graph.facebook.com/v19.0/' + pageId + '/insights?metric=page_impressions&period=day&since=2025-12-01&until=2025-12-31&access_token=' + pt);
    const d1 = await r1.json();
    if (d1.error) {
        console.log('FB page_impressions FAILED:', d1.error.message);
        // Try without date range
        const r1b = await fetch('https://graph.facebook.com/v19.0/' + pageId + '/insights?metric=page_impressions&period=day&access_token=' + pt);
        const d1b = await r1b.json();
        if (d1b.error) console.log('FB page_impressions (no date) FAILED:', d1b.error.message);
        else console.log('FB page_impressions (no date) OK - latest value:', d1b.data?.[0]?.values?.slice(-1)?.[0]?.value);
    } else {
        const total = (d1.data?.[0]?.values || []).reduce((s, v) => s + (v.value || 0), 0);
        console.log('FB page_impressions OK: total =', total);
    }

    // Test IG
    if (igId) {
        console.log('IG id:', igId, '| followers:', pageInfo.instagram_business_account?.followers_count);
        // Test IG with metric_type=total_value
        const r2 = await fetch('https://graph.facebook.com/v19.0/' + igId + '/insights?metric=views,reach,total_interactions,website_clicks,profile_views,follows_and_unfollows&metric_type=total_value&since=2025-12-01&until=2025-12-31&access_token=' + pt);
        const d2 = await r2.json();
        if (d2.error) {
            console.log('IG total_value FAILED:', d2.error.message);
        } else {
            console.log('IG total_value OK:');
            (d2.data || []).forEach(m => {
                const v = m.total_value;
                const val = v && typeof v.value === 'number' ? v.value : JSON.stringify(v);
                console.log('  ' + m.name + ':', val);
            });
        }
    } else {
        console.log('No IG account linked');
    }
}

async function main() {
    const connections = await prisma.socialConnection.findMany({
        where: { platform: 'FACEBOOK', isActive: true }
    });
    console.log('Found', connections.length, 'FB connections');
    for (const c of connections) {
        await testPage(c, c.id);
    }
    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/test_meta.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_meta.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
