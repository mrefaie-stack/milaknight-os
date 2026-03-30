const { Client } = require('ssh2');
const conn = new Client();
const script = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
    // Find all SNAPCHAT connections
    const snaps = await prisma.socialConnection.findMany({
        where: { platform: 'SNAPCHAT' },
        select: { id: true, userId: true, clientId: true, platformAccountId: true, platformAccountName: true, metadata: true, accessToken: true, refreshToken: true, expiresAt: true }
    });
    console.log('Current SNAPCHAT connections:', JSON.stringify(snaps.map(s => ({
        id: s.id, clientId: s.clientId,
        platformAccountId: s.platformAccountId,
        platformAccountName: s.platformAccountName,
        hasMetadata: !!s.metadata,
        metadata: s.metadata ? JSON.parse(s.metadata) : null
    })), null, 2));

    // For each connection that has metadata with orgId, update platformAccountId to orgId
    for (const snap of snaps) {
        if (!snap.metadata) continue;
        const meta = JSON.parse(snap.metadata);
        if (meta.orgId && meta.orgId !== 'unknown' && snap.platformAccountId !== meta.orgId) {
            console.log('\\nUpdating connection', snap.id, 'from', snap.platformAccountId, 'to org', meta.orgId);
            try {
                await prisma.socialConnection.update({
                    where: { id: snap.id },
                    data: {
                        platformAccountId: meta.orgId,
                        platformAccountName: meta.orgName || snap.platformAccountName
                    }
                });
                console.log('Done!');
            } catch(e) {
                console.error('Update failed:', e.message);
                // May conflict if org record already exists - delete old and keep new
            }
        } else {
            console.log('\\nConnection', snap.id, 'already uses orgId or no metadata - skipping');
        }
    }
}
main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/fix_snap_org.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/fix_snap_org.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
