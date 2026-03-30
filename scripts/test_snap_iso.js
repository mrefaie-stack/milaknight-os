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
    const base = 'https://adsapi.snapchat.com/v1';
    const adAccountId = '64c47830-10f4-4d3b-ab1f-d5f12da81cdf';
    const campaignId = '9990d621-85da-4be7-b7cd-7a4d2e1a1c56'; // ACTIVE one
    const headers = { Authorization: 'Bearer ' + token };

    // Test A: 2025 timestamps to verify if 2026 is the issue
    const start2025 = Math.floor(new Date('2025-12-01T00:00:00Z').getTime() / 1000);
    const end2025 = Math.floor(new Date('2025-12-31T23:59:59Z').getTime() / 1000);
    console.log('=== A: 2025 timestamps ===');
    const rA = await fetch(base + '/campaigns/' + campaignId + '/stats?granularity=TOTAL&fields=impressions,swipes,spend,video_views&start_time=' + start2025 + '&end_time=' + end2025, { headers });
    const bA = await rA.json();
    console.log('Status:', rA.status, JSON.stringify(bA).substring(0, 500));

    // Test B: Older 2026 dates - Jan 2026
    const startJan2026 = Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000);
    const endJan2026 = Math.floor(new Date('2026-01-31T23:59:59Z').getTime() / 1000);
    console.log('\\n=== B: Jan 2026 timestamps ===');
    console.log('Timestamps:', startJan2026, endJan2026);
    const rB = await fetch(base + '/campaigns/' + campaignId + '/stats?granularity=TOTAL&fields=impressions,swipes,spend&start_time=' + startJan2026 + '&end_time=' + endJan2026, { headers });
    const bB = await rB.json();
    console.log('Status:', rB.status, JSON.stringify(bB).substring(0, 500));

    // Test C: Current Snapchat API - try no start/end, just pivot
    console.log('\\n=== C: Campaign stats no dates ===');
    const rC = await fetch(base + '/campaigns/' + campaignId + '/stats?granularity=TOTAL&fields=impressions,swipes,spend', { headers });
    const bC = await rC.json();
    console.log('Status:', rC.status, JSON.stringify(bC).substring(0, 500));

    // Test D: All campaigns stats aggregated (use /campaigns/{id}/stats for each)
    // Try last active campaign with VERY recent dates - just last 24 hours
    const startToday = Math.floor(new Date().setHours(0,0,0,0) / 1000);
    const endNow = Math.floor(Date.now() / 1000);
    console.log('\\n=== D: Today only ===');
    console.log('Timestamps:', startToday, endNow);
    const rD = await fetch(base + '/campaigns/' + campaignId + '/stats?granularity=TOTAL&fields=impressions,swipes,spend&start_time=' + startToday + '&end_time=' + endNow, { headers });
    const bD = await rD.json();
    console.log('Status:', rD.status, JSON.stringify(bD).substring(0, 500));

    // Test E: AdAccount spend only (which works according to error)
    console.log('\\n=== E: AdAccount SPEND ONLY with 2025 dates ===');
    const rE = await fetch(base + '/adaccounts/' + adAccountId + '/stats?granularity=TOTAL&fields=spend&start_time=' + start2025 + '&end_time=' + end2025, { headers });
    const bE = await rE.json();
    console.log('Status:', rE.status, JSON.stringify(bE).substring(0, 500));

    // Test F: Try with "reporting" endpoint (newer Snapchat API)
    console.log('\\n=== F: Reporting endpoint ===');
    const rF = await fetch(base + '/adaccounts/' + adAccountId + '/entity_stats?granularity=TOTAL&fields=impressions,swipes,spend&start_time=' + start2025 + '&end_time=' + end2025, { headers });
    console.log('Status:', rF.status);
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/snap_iso.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/snap_iso.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
