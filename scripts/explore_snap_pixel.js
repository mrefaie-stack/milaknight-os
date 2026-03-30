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
    const adAccount = '64c47830-10f4-4d3b-ab1f-d5f12da81cdf';
    const pixel1 = '6f566151-accc-4441-b420-939362ee3c5e';
    const pixel2 = '838171b8-be3a-49e3-a46c-96a12338840a';
    const profileId = '2bb21273-d4a4-4e2e-ae54-579528c6f51d';
    const base = 'https://adsapi.snapchat.com/v1';
    const h = { Authorization: 'Bearer ' + token };

    const get = async (label, url) => {
        const r = await fetch(url, { headers: h });
        const b = await r.json().catch(() => ({}));
        console.log('\\n=== ' + label + ' === Status:' + r.status);
        console.log(JSON.stringify(b, null, 2).substring(0, 2000));
    };

    // Pixel stats - various formats
    await get('Pixel1 Stats TOTAL', base + '/pixels/' + pixel1 + '/stats?granularity=TOTAL&fields=number_events,number_click_events,number_view_events');
    await get('Pixel2 Stats TOTAL', base + '/pixels/' + pixel2 + '/stats?granularity=TOTAL');
    await get('Pixel1 domain stats', base + '/pixels/' + pixel1 + '/domain_stats');
    await get('Pixel1 no params', base + '/pixels/' + pixel1 + '/stats');

    // Ad-level stats for active campaign ads
    const adId = '0b6d840b-788a-4bd0-881b-e7f747eb4121';
    await get('Single Ad Stats', base + '/ads/' + adId + '/stats?granularity=TOTAL&fields=impressions,swipes,spend,video_views,frequency,uniques');

    // Creative stats
    await get('Creative Stats', base + '/creatives/82263456-3b33-4fa7-9abb-629b33da5bce/stats?granularity=TOTAL&fields=impressions,swipes,spend,video_views,frequency,uniques');

    // Public profile attempt with adaccount token
    await get('Public Profile direct', base + '/public_profiles/' + profileId);
    await get('Public Profile stats', base + '/public_profiles/' + profileId + '/stats?granularity=TOTAL&fields=followers,uniq_impressions');

    // Try adaccount level stats without reach
    await get('AdAccount Stats no reach', base + '/adaccounts/' + adAccount + '/stats?granularity=TOTAL&fields=impressions,swipes,spend,video_views,frequency,uniques');

    // Audience info
    await get('Lookalike segment users', base + '/segments/4617984571090630');
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/snap_pixel.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/snap_pixel.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
