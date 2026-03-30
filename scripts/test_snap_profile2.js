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
    const profileId = '2bb21273-d4a4-4e2e-ae54-579528c6f51d';
    const h = { Authorization: 'Bearer ' + token };

    const get = async (label, url) => {
        const r = await fetch(url, { headers: h });
        const b = await r.json().catch(() => ({}));
        console.log('\\n=== ' + label + ' === Status:' + r.status);
        console.log(JSON.stringify(b, null, 2).substring(0, 2000));
    };

    await get('Profile', base + '/public_profiles/' + profileId);
    await get('Profile Stats', base + '/public_profiles/' + profileId + '/stats');
    await get('Profile Stats TOTAL', base + '/public_profiles/' + profileId + '/stats?granularity=TOTAL');
    await get('Profile Spotlight Stats', base + '/public_profiles/' + profileId + '/spotlight_stats');
    await get('Profile Stories', base + '/public_profiles/' + profileId + '/story_subscriptions');

    // Also try campaign-level ad squads stats for the active campaign
    const activeCampaign = '9990d621-85da-4be7-b7cd-7a4d2e1a1c56';
    await get('Active Campaign AdSquads', base + '/campaigns/' + activeCampaign + '/adsquads');
    await get('AdSquad stats (active)', base + '/adsquads/058d44b6-f9b0-4209-a90e-816a51459c9c/stats?granularity=TOTAL&fields=impressions,swipes,spend,video_views,reach,frequency,uniques');
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/snap_prof2.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/snap_prof2.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
