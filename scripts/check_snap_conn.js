const { Client } = require('ssh2');
const conn = new Client();
const script = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const snaps = await prisma.socialConnection.findMany({
        where: { platform: 'SNAPCHAT' },
        select: { id: true, userId: true, clientId: true, platformAccountId: true, platformAccountName: true, isActive: true, expiresAt: true }
    });
    console.log('SNAPCHAT connections:', JSON.stringify(snaps, null, 2));

    const clients = await prisma.client.findMany({
        where: { name: { contains: 'الصايغ' } },
        select: { id: true, name: true, userId: true }
    });
    console.log('\\nSaigh clients:', JSON.stringify(clients, null, 2));
}
main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/check_snap.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/check_snap.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
