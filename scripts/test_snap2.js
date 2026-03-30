// Direct test - reads token from DB then tests API
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
    const adAccountId = '64c47830-10f4-4d3b-ab1f-d5f12da81cdf'; // MilaKnight Self Service

    const since = new Date(); since.setDate(since.getDate() - 7);
    const startTime = Math.floor(since.getTime() / 1000);
    const endTime = Math.floor(new Date().getTime() / 1000);
    console.log('start:', startTime, new Date(startTime*1000).toISOString());
    console.log('end:', endTime, new Date(endTime*1000).toISOString());

    // Test granularity=DAY
    const url1 = \`https://adsapi.snapchat.com/v1/adaccounts/\${adAccountId}/stats?granularity=DAY&fields=impressions,swipes,spend,video_views,reach&start_time=\${startTime}&end_time=\${endTime}\`;
    const r1 = await fetch(url1, { headers: { Authorization: 'Bearer ' + token } });
    const b1 = await r1.json();
    console.log('\\nDAY status:', r1.status);
    console.log('DAY response:', JSON.stringify(b1, null, 2).substring(0, 3000));

    // Test public profiles
    const orgId = 'b253ae21-d73e-4618-8aa4-6d42944a2dda';
    const r2 = await fetch('https://adsapi.snapchat.com/v1/organizations/' + orgId + '/public_profiles', {
        headers: { Authorization: 'Bearer ' + token }
    });
    const b2 = await r2.json();
    console.log('\\nPublic Profiles status:', r2.status);
    console.log('Public Profiles:', JSON.stringify(b2, null, 2).substring(0, 2000));
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/test_snap2.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/test_snap2.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
