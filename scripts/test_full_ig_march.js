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
    const until = '2026-03-31';

    const pageRes = await fetch('https://graph.facebook.com/v19.0/' + pageId + '?fields=name,fan_count,access_token,instagram_business_account{id,followers_count}&access_token=' + pt);
    const pageInfo = await pageRes.json();
    const pageToken = pageInfo.access_token || pt;
    const igId = pageInfo.instagram_business_account?.id;
    console.log('Page:', pageInfo.name, '| IG id:', igId, '| IG followers:', pageInfo.instagram_business_account?.followers_count);
    console.log('Using pageToken:', pageToken ? 'YES (length=' + pageToken.length + ')' : 'NO - using user token');

    // === CALL 1: Main metrics ===
    console.log('\\n=== CALL 1: reach,views,total_interactions,website_clicks,profile_views ===');
    const url1 = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=reach,views,total_interactions,website_clicks,profile_views&metric_type=total_value&period=day&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const r1 = await fetch(url1);
    const d1 = await r1.json();
    if (d1.error) {
        console.log('ERROR:', d1.error.message);
    } else {
        (d1.data || []).forEach(m => {
            const tv = m.total_value;
            const val = tv ? (typeof tv.value === 'number' ? tv.value : JSON.stringify(tv)) : 'NO total_value';
            console.log('  ' + m.name + ': ' + val);
        });
    }

    // === CALL 2: follows_and_unfollows with breakdown=follow_type ===
    console.log('\\n=== CALL 2: follows_and_unfollows + breakdown=follow_type ===');
    const url2 = 'https://graph.facebook.com/v19.0/' + igId + '/insights?metric=follows_and_unfollows&metric_type=total_value&period=day&breakdown=follow_type&since=' + since + '&until=' + until + '&access_token=' + pageToken;
    const r2 = await fetch(url2);
    const d2 = await r2.json();
    if (d2.error) {
        console.log('ERROR:', d2.error.message);
    } else {
        const item = d2.data?.[0];
        if (!item) { console.log('No data returned'); }
        else {
            console.log('total_value:', JSON.stringify(item.total_value, null, 2));
            if (item.total_value?.breakdowns) {
                const bd = item.total_value.breakdowns[0];
                console.log('breakdown dimension_keys:', bd?.dimension_keys);
                (bd?.results || []).forEach(r => {
                    console.log('  dimension_values:', r.dimension_values, '=> value:', r.value);
                });
            }
        }
    }

    // === SIMULATED RESULT: what auto-report would produce ===
    console.log('\\n=== SIMULATED RESULT (what report will show) ===');
    const sumDailyValues = (data, metricName) => {
        const row = data.find(r => r.name === metricName);
        if (!row) return 'METRIC NOT FOUND';
        if (row.total_value !== undefined) {
            const tv = row.total_value;
            if (typeof tv?.value === 'number') return tv.value;
            if (Array.isArray(tv?.breakdowns?.[0]?.results)) {
                const followEntry = tv.breakdowns[0].results.find(r => r.dimension_values?.includes('NON_FOLLOWER'));
                return followEntry ? followEntry.value : 'NON_FOLLOWER not found, results: ' + JSON.stringify(tv.breakdowns[0].results);
            }
            return 'total_value exists but no value/breakdown: ' + JSON.stringify(tv);
        }
        if (!row.values?.length) return 0;
        return row.values.reduce((acc, v) => acc + (Number(v.value) || 0), 0);
    };

    const allData = [...(d1.data || []), ...(d2.data || [])];
    console.log('views:', sumDailyValues(allData, 'views'));
    console.log('reach:', sumDailyValues(allData, 'reach'));
    console.log('engagement:', sumDailyValues(allData, 'total_interactions'));
    console.log('clicks:', sumDailyValues(allData, 'website_clicks'));
    console.log('profileVisits:', sumDailyValues(allData, 'profile_views'));
    console.log('followers (new):', sumDailyValues(allData, 'follows_and_unfollows'));

    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/test_full_ig.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_full_ig.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
