const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const remoteScript = [
        "const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');",
        "const prisma = new PrismaClient();",
        "async function cleanup() {",
        "  try {",

        // 1. Deactivate orphan FACEBOOK connection (no clientId, admin user)
        "    const r1 = await prisma.$queryRawUnsafe(\"UPDATE \\\"SocialConnection\\\" SET \\\"isActive\\\" = false WHERE id = 'cmmmyq3kr0001i1a7n33uk1ig'\");",
        "    console.log('Deactivated orphan FACEBOOK (cmmmyq3kr0001i1a7n33uk1ig):', JSON.stringify(r1));",

        // 2. Deactivate orphan SNAPCHAT connection (no clientId, empty adAccounts)
        "    const r2 = await prisma.$queryRawUnsafe(\"UPDATE \\\"SocialConnection\\\" SET \\\"isActive\\\" = false WHERE id = 'cmn2avjye0005i10y3l3xsp50'\");",
        "    console.log('Deactivated orphan SNAPCHAT (cmn2avjye0005i10y3l3xsp50):', JSON.stringify(r2));",

        // 3. Deactivate old/wrong FACEBOOK for doaa (raw ID as name — the older one)
        "    const r3 = await prisma.$queryRawUnsafe(\"UPDATE \\\"SocialConnection\\\" SET \\\"isActive\\\" = false WHERE id = 'cmmmz4yez0001i1z2j754dlul'\");",
        "    console.log('Deactivated duplicate FACEBOOK old (cmmmz4yez0001i1z2j754dlul):', JSON.stringify(r3));",

        // Verify final state
        "    const final = await prisma.$queryRawUnsafe('SELECT platform, COUNT(*)::int as total, COUNT(CASE WHEN \"isActive\" = true THEN 1 END)::int as active, COUNT(CASE WHEN \"clientId\" IS NULL AND \"isActive\" = true THEN 1 END)::int as orphan_active FROM \"SocialConnection\" GROUP BY platform ORDER BY platform');",
        "    console.log('\\n=== FINAL STATE ===');",
        "    console.log(JSON.stringify(final, null, 2));",

        "    const dupCheck = await prisma.$queryRawUnsafe('SELECT \"clientId\", platform, COUNT(*)::int as count FROM \"SocialConnection\" WHERE \"isActive\" = true GROUP BY \"clientId\", platform HAVING COUNT(*) > 1');",
        "    console.log('Remaining duplicates:', JSON.stringify(dupCheck));",

        "    await prisma.$disconnect();",
        "  } catch(e) { console.error('CLEANUP FAILED:', e.message); await prisma.$disconnect(); process.exit(1); }",
        "}",
        "cleanup();"
    ].join('\n');

    conn.sftp((sftpErr, sftp) => {
        if (sftpErr) { console.error('SFTP error:', sftpErr); conn.end(); return; }
        const remotePath = '/tmp/mk_cleanup.js';
        const stream = sftp.createWriteStream(remotePath);
        stream.on('close', () => {
            sftp.end();
            conn.exec(`cd /root/milaknight-os && node ${remotePath}`, (err, execStream) => {
                if (err) { console.error('Exec error:', err); conn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => conn.end());
            });
        });
        stream.end(remoteScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
