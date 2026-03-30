const { Client } = require('ssh2');
const conn = new Client();
const script = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
    // Who is client cmmko1u8t000bi1ect27lj6qz?
    const client = await prisma.client.findUnique({
        where: { id: 'cmmko1u8t000bi1ect27lj6qz' },
        select: { id: true, name: true, userId: true }
    });
    console.log('Client record:', JSON.stringify(client));

    // Who is user cmmko1u8n000ai1ec839t0bgh?
    const user = await prisma.user.findUnique({
        where: { id: 'cmmko1u8n000ai1ec839t0bgh' },
        select: { id: true, email: true, role: true, firstName: true, lastName: true }
    });
    console.log('User (from connection):', JSON.stringify(user));

    // All clients with their userId
    const clients = await prisma.client.findMany({
        select: { id: true, name: true, userId: true },
        orderBy: { name: 'asc' }
    });
    console.log('\\nAll clients:');
    clients.forEach(c => console.log(' -', c.name, '| clientId:', c.id, '| userId:', c.userId));
}
main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/check_snap2.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/check_snap2.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
