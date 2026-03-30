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
    const orgId = connection.platformAccountId;
    const adAccount = '64c47830-10f4-4d3b-ab1f-d5f12da81cdf';
    const base = 'https://adsapi.snapchat.com/v1';
    const h = { Authorization: 'Bearer ' + token };

    const get = async (label, url) => {
        const r = await fetch(url, { headers: h });
        const b = await r.json().catch(() => ({}));
        console.log('\\n=== ' + label + ' === Status:' + r.status);
        console.log(JSON.stringify(b, null, 2).substring(0, 2000));
    };

    console.log('orgId:', orgId);

    // Try public profiles from org
    await get('Org Public Profiles', base + '/organizations/' + orgId + '/public_profiles');

    // Try /me to see full scope
    await get('Me', base + '/me');

    // Try audience match
    await get('Audience Segments', base + '/adaccounts/' + adAccount + '/segments');

    // Pixel stats
    await get('Pixels', base + '/adaccounts/' + adAccount + '/pixels');

    // Try ad-level stats for the active campaign
    const activeCampaign = '9990d621-85da-4be7-b7cd-7a4d2e1a1c56';
    await get('Ads in campaign', base + '/campaigns/' + activeCampaign + '/ads');

    // Creatives with stats
    await get('Creatives', base + '/adaccounts/' + adAccount + '/creatives');

    // Try adaccount stats total
    await get('AdAccount Stats Total', base + '/adaccounts/' + adAccount + '/stats?granularity=TOTAL&fields=impressions,swipes,spend,video_views,reach,frequency,uniques');
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/snap_organic.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/snap_organic.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
