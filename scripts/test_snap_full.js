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
    const adAccount = '64c47830-10f4-4d3b-ab1f-d5f12da81cdf';
    const h = { Authorization: 'Bearer ' + token };

    const get = async (label, url) => {
        const r = await fetch(url, { headers: h });
        const b = await r.json().catch(() => ({}));
        console.log('\\n=== ' + label + ' === Status:' + r.status);
        console.log(JSON.stringify(b, null, 2).substring(0, 1500));
    };

    // Campaign details (full)
    await get('Campaigns full', base + '/adaccounts/' + adAccount + '/campaigns');

    // Ad Squads
    await get('Ad Squads', base + '/adaccounts/' + adAccount + '/adsquads');

    // Creatives
    await get('Creatives', base + '/adaccounts/' + adAccount + '/creatives');

    // Media
    await get('Media', base + '/adaccounts/' + adAccount + '/media');

    // Funding sources (budget)
    await get('Funding Sources', base + '/adaccounts/' + adAccount + '/funding_sources');

    // Billing center
    await get('Billing', 'https://adsapi.snapchat.com/v1/billingcenters/3e06d882-92f2-4b19-999e-0e924736c78e');
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/snap_full.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/snap_full.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
