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
    const orgId = 'b253ae21-d73e-4618-8aa4-6d42944a2dda';
    const adAccount1 = '0103b5be-5b1c-4fbf-a6ce-46a068e88c78';
    const adAccount2 = '64c47830-10f4-4d3b-ab1f-d5f12da81cdf';
    const h = { Authorization: 'Bearer ' + token };

    const test = async (label, url) => {
        const r = await fetch(url, { headers: h });
        const b = await r.json().catch(() => ({}));
        console.log('\\n=== ' + label + ' ===');
        console.log('Status:', r.status);
        console.log(JSON.stringify(b, null, 2).substring(0, 800));
    };

    await test('me', base + '/me');
    await test('Org public_profiles', base + '/organizations/' + orgId + '/public_profiles');
    await test('AdAccount1 public_profiles', base + '/adaccounts/' + adAccount1 + '/public_profiles');
    await test('AdAccount2 public_profiles', base + '/adaccounts/' + adAccount2 + '/public_profiles');
    await test('Me organizations', base + '/me/organizations');

    // Try different base URL for public profiles
    await test('snap.com profile', 'https://kit.snapchat.com/v1/me');

    // Try public_profiles listing
    await test('public_profiles search', base + '/public_profiles?name=milaknight');
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/snap_profile.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/snap_profile.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
