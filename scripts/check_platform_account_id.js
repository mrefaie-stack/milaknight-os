const { Client } = require('ssh2');

const testScript = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const conn = await prisma.socialConnection.findFirst({ where: { platform: 'FACEBOOK', isActive: true, clientId: { not: null } } });
    console.log('platformAccountId:', conn.platformAccountId);
    console.log('metadata:', conn.metadata);
    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/check_paid.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/check_paid.js 2>&1', (err2, s) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                s.on('data', d => process.stdout.write(d.toString()));
                s.stderr.on('data', d => process.stderr.write(d.toString()));
                s.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
