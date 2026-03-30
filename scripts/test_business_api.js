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
    const profileId = '2bb21273-d4a4-4e2e-ae54-579528c6f51d';
    const base = 'https://businessapi.snapchat.com';
    const h = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

    const get = async (label, url) => {
        const r = await fetch(url, { headers: h });
        const b = await r.json().catch(() => ({}));
        console.log('\\n=== ' + label + ' === Status:' + r.status);
        console.log(JSON.stringify(b, null, 2).substring(0, 3000));
    };

    console.log('orgId:', orgId, 'profileId:', profileId);

    // Public endpoints (no creator auth needed)
    await get('PUBLIC: Profile by ID', base + '/public/v1/public_profiles/' + profileId);
    await get('PUBLIC: Profile Stats (SUBSCRIBERS)', base + '/public/v1/public_profiles/' + profileId + '/stats?fields=SUBSCRIBERS&granularity=TOTAL');
    await get('PUBLIC: Profile Stats (SPOTLIGHT)', base + '/public/v1/public_profiles/' + profileId + '/stats?fields=SPOTLIGHT_VIEWS,SPOTLIGHT_SHARES&granularity=TOTAL');
    await get('PUBLIC: Stories', base + '/public/v1/public_profiles/' + profileId + '/stories');
    await get('PUBLIC: Spotlights', base + '/public/v1/public_profiles/' + profileId + '/spotlights');

    // Authorized endpoints (with our marketing token)
    await get('AUTH: My Profile', base + '/v1/public_profiles/my_profile');
    await get('AUTH: Org Profiles', base + '/v1/organizations/' + orgId + '/public_profiles');
    await get('AUTH: Profile Stats Full', base + '/v1/public_profiles/' + profileId + '/stats?fields=SUBSCRIBERS,STORY_VIEWS,PROFILE_VIEWS,SPOTLIGHT_VIEWS&granularity=TOTAL');

    // Search by username
    await get('PUBLIC: Search username', base + '/public/v1/public_profiles/search?query=milaknight.mk');
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/snap_business.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/snap_business.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
