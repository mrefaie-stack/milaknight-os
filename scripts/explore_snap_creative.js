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
    const base = 'https://adsapi.snapchat.com/v1';
    const h = { Authorization: 'Bearer ' + token };

    const get = async (label, url) => {
        const r = await fetch(url, { headers: h });
        const b = await r.json().catch(() => ({}));
        console.log('\\n=== ' + label + ' === Status:' + r.status);
        console.log(JSON.stringify(b, null, 2).substring(0, 2500));
    };

    // Creative stats with LIFETIME
    const creativeId = '044a778b-5481-4ee3-9eb4-dff3bf99a056';
    await get('Creative LIFETIME', base + '/creatives/' + creativeId + '/stats?granularity=LIFETIME&fields=impressions,swipes,spend,video_views,frequency,uniques');

    // All creatives stats via adaccount
    await get('AdAccount Creatives Stats', base + '/adaccounts/' + adAccount + '/creatives/stats?granularity=LIFETIME&fields=impressions,swipes,spend,video_views');

    // Pixel stats - try event field names
    await get('Pixel PAGE_VIEW', base + '/pixels/' + pixel1 + '/stats?granularity=TOTAL&fields=PAGE_VIEW');
    await get('Pixel page_view lower', base + '/pixels/' + pixel1 + '/stats?granularity=TOTAL&fields=page_view');
    await get('Pixel events', base + '/pixels/' + pixel1 + '/stats?granularity=TOTAL&fields=number_click_events,number_view_events,number_events_total');

    // Try adaccount reach stats (it said only reach fields work)
    await get('AdAccount Reach Only', base + '/adaccounts/' + adAccount + '/stats?granularity=TOTAL&fields=reach,uniques,frequency');

    // List all ads across all campaigns in the ad account
    await get('All Ads in AdAccount', base + '/adaccounts/' + adAccount + '/ads');
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/snap_creative.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/snap_creative.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
