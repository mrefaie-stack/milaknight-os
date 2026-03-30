const { Client } = require('ssh2');
const conn = new Client();
const script = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const connection = await prisma.socialConnection.findFirst({
        where: { platform: 'SNAPCHAT', clientId: 'cmmko1u8t000bi1ect27lj6qz', isActive: true }
    });
    const token = connection.accessToken;
    const adAccountId = '64c47830-10f4-4d3b-ab1f-d5f12da81cdf';
    const base = 'https://adsapi.snapchat.com/v1';

    const headers = { Authorization: 'Bearer ' + token };

    // Test A: List campaigns (no date params needed)
    console.log('=== A: List Campaigns ===');
    const rA = await fetch(base + '/adaccounts/' + adAccountId + '/campaigns', { headers });
    const bA = await rA.json();
    console.log('Status:', rA.status);
    const campaigns = (bA.campaigns || []).map(c => c.campaign).filter(Boolean);
    console.log('Campaigns count:', campaigns.length);
    campaigns.forEach(c => console.log(' -', c.id, c.name, c.status));

    // Test B: Stats without date params
    console.log('\\n=== B: Stats no dates ===');
    const rB = await fetch(base + '/adaccounts/' + adAccountId + '/stats?granularity=TOTAL&fields=impressions,swipes,spend', { headers });
    const bB = await rB.json();
    console.log('Status:', rB.status, JSON.stringify(bB).substring(0, 500));

    // Test C: Stats with Riyadh midnight (UTC+3, so UTC is -3h = midnight riyadh = 21:00 prev day UTC)
    const nowRiyadh = new Date(Date.now() + 3*3600*1000); // shift to riyadh
    const nowRiyadhStr = nowRiyadh.toISOString().split('T')[0];
    const startRiyadh = new Date(nowRiyadh); startRiyadh.setDate(startRiyadh.getDate() - 7);
    const startRiyadhStr = startRiyadh.toISOString().split('T')[0];

    // Midnight in Riyadh = 21:00 UTC previous day
    const startUtc = new Date(startRiyadhStr + 'T21:00:00Z');
    const endUtc = new Date(nowRiyadhStr + 'T20:59:59Z');
    const startMs = startUtc.getTime();
    const endMs = endUtc.getTime();
    console.log('\\n=== C: Stats Riyadh timezone aligned ===');
    console.log('Start:', startUtc.toISOString(), '=', Math.floor(startMs/1000), 'sec =', startMs, 'ms');
    console.log('End:', endUtc.toISOString());
    // Try MILLISECONDS
    const rC = await fetch(base + '/adaccounts/' + adAccountId + '/stats?granularity=DAY&fields=impressions,swipes,spend,video_views,reach&start_time=' + startMs + '&end_time=' + endMs, { headers });
    const bC = await rC.json();
    console.log('MS Status:', rC.status, JSON.stringify(bC).substring(0, 500));

    // Try SECONDS
    const rC2 = await fetch(base + '/adaccounts/' + adAccountId + '/stats?granularity=DAY&fields=impressions,swipes,spend,video_views,reach&start_time=' + Math.floor(startMs/1000) + '&end_time=' + Math.floor(endMs/1000), { headers });
    const bC2 = await rC2.json();
    console.log('SEC Status:', rC2.status, JSON.stringify(bC2).substring(0, 500));

    // Test D: Campaign-level stats if campaigns exist
    if (campaigns.length > 0) {
        const campaignId = campaigns[0].id;
        console.log('\\n=== D: Campaign stats for', campaignId, '===');
        const startSec = Math.floor(startUtc.getTime()/1000);
        const endSec = Math.floor(endUtc.getTime()/1000);
        const rD = await fetch(base + '/campaigns/' + campaignId + '/stats?granularity=TOTAL&fields=impressions,swipes,spend&start_time=' + startSec + '&end_time=' + endSec, { headers });
        const bD = await rD.json();
        console.log('Status:', rD.status, JSON.stringify(bD).substring(0, 500));
    }

    // Test E: Stats with pivot_type=AD_ACCOUNT
    console.log('\\n=== E: With pivot_type ===');
    const startSec = Math.floor(startUtc.getTime()/1000);
    const endSec = Math.floor(endUtc.getTime()/1000);
    const rE = await fetch(base + '/adaccounts/' + adAccountId + '/stats?granularity=TOTAL&fields=impressions,swipes,spend&start_time=' + startSec + '&end_time=' + endSec + '&pivot_type=AD_ACCOUNT', { headers });
    const bE = await rE.json();
    console.log('Status:', rE.status, JSON.stringify(bE).substring(0, 500));
}
main().catch(e => console.error('ERROR:', e.message, e.stack)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/snap_fmt.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/snap_fmt.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
