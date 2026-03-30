const { Client } = require('ssh2');
const conn = new Client();
const script = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
    // Delete the old ad-account-level connections for the client
    // Keep: cmn2bu4z2000bi18fu1a4ytsx (already updated to orgId with full metadata)
    // Delete: cmn2avuoh0009i10yel4mn8h1 and cmn2bu99j000di18fhgdyoup4 (duplicates)
    const toDelete = ['cmn2avuoh0009i10yel4mn8h1', 'cmn2bu99j000di18fhgdyoup4'];
    for (const id of toDelete) {
        await prisma.socialConnection.delete({ where: { id } });
        console.log('Deleted:', id);
    }

    // Show final state
    const snaps = await prisma.socialConnection.findMany({
        where: { platform: 'SNAPCHAT' },
        select: { id: true, clientId: true, platformAccountId: true, platformAccountName: true, metadata: true }
    });
    console.log('\\nFinal SNAPCHAT connections:', JSON.stringify(snaps.map(s => ({
        id: s.id,
        clientId: s.clientId,
        platformAccountId: s.platformAccountId,
        platformAccountName: s.platformAccountName,
        adAccountsInMeta: s.metadata ? JSON.parse(s.metadata).adAccounts?.length : 0
    })), null, 2));
}
main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/cleanup_snap.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/cleanup_snap.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
