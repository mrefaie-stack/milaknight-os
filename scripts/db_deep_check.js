const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const remoteScript = [
        "const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');",
        "const prisma = new PrismaClient();",
        "const q = (s) => prisma.$queryRawUnsafe(s);",
        "async function check() {",
        "  try {",

        // Orphan connections detail
        "    const orphanDetail = await q('SELECT id, platform, \"platformAccountName\", \"userId\", \"isActive\", \"expiresAt\" FROM \"SocialConnection\" WHERE \"clientId\" IS NULL AND \"isActive\" = true');",

        // Duplicate FACEBOOK connections detail
        "    const dupDetail = await q('SELECT sc.id, sc.\"platformAccountName\", sc.\"platformAccountId\", sc.\"isActive\", sc.\"expiresAt\", sc.\"createdAt\" FROM \"SocialConnection\" sc WHERE sc.\"clientId\" = \\'cmmmvvvbx000ai1cp8gywayf0\\' AND sc.platform = \\'FACEBOOK\\' ORDER BY sc.\"createdAt\" DESC');",

        // All active connections details
        "    const allConns = await q('SELECT sc.id, sc.platform, sc.\"platformAccountName\", sc.\"platformAccountId\", c.name as client_name, sc.\"isActive\", sc.\"expiresAt\", sc.\"refreshToken\" IS NOT NULL as has_refresh, LENGTH(sc.\"accessToken\") as token_len, sc.\"createdAt\", sc.\"updatedAt\" FROM \"SocialConnection\" sc LEFT JOIN \"Client\" c ON c.id = sc.\"clientId\" WHERE sc.\"isActive\" = true ORDER BY sc.platform, c.name');",

        // Facebook connections with no expiry - how old are they?
        "    const fbOld = await q('SELECT sc.id, c.name as client_name, sc.\"createdAt\", sc.\"updatedAt\", sc.\"expiresAt\", LENGTH(sc.\"accessToken\") as token_len FROM \"SocialConnection\" sc LEFT JOIN \"Client\" c ON c.id = sc.\"clientId\" WHERE sc.platform = \\'FACEBOOK\\' AND sc.\"isActive\" = true AND sc.\"expiresAt\" IS NULL ORDER BY sc.\"createdAt\"');",

        // All clients details
        "    const clientDetails = await q('SELECT c.id, c.name, c.\"userId\", u.email as user_email, c.\"amId\", am.email as am_email, c.\"activeServices\" FROM \"Client\" c LEFT JOIN \"User\" u ON u.id = c.\"userId\" LEFT JOIN \"User\" am ON am.id = c.\"amId\"');",

        // Reports details
        "    const reportDetails = await q('SELECT r.id, r.month, r.status, r.\"mmStatus\", c.name as client_name, r.\"createdAt\", r.\"scheduledSendAt\", LENGTH(r.metrics) as metrics_len FROM \"Report\" r JOIN \"Client\" c ON c.id = r.\"clientId\" ORDER BY r.\"createdAt\" DESC');",

        // Check if Snapchat metadata has adAccounts
        "    const snapConns = await q('SELECT id, \"platformAccountId\", \"platformAccountName\", \"expiresAt\", \"metadata\" FROM \"SocialConnection\" WHERE platform = \\'SNAPCHAT\\' AND \"isActive\" = true');",

        // Check X connection metadata
        "    const xConns = await q('SELECT id, \"platformAccountId\", \"platformAccountName\", \"expiresAt\", metadata FROM \"SocialConnection\" WHERE platform = \\'X\\' AND \"isActive\" = true');",

        // Check Google connection metadata
        "    const googleConns = await q('SELECT id, \"platformAccountId\", \"platformAccountName\", \"expiresAt\", metadata FROM \"SocialConnection\" WHERE platform = \\'GOOGLE\\' AND \"isActive\" = true');",

        "    console.log('=== ORPHAN ACTIVE CONNECTIONS (no clientId) ===');",
        "    console.log(JSON.stringify(orphanDetail, null, 2));",
        "    console.log('\\n=== DUPLICATE FACEBOOK FOR CLIENT cmmmvvvbx000ai1cp8gywayf0 ===');",
        "    console.log(JSON.stringify(dupDetail, null, 2));",
        "    console.log('\\n=== ALL ACTIVE CONNECTIONS DETAIL ===');",
        "    console.log(JSON.stringify(allConns, null, 2));",
        "    console.log('\\n=== FACEBOOK NULL-EXPIRY CONNECTIONS ===');",
        "    console.log(JSON.stringify(fbOld, null, 2));",
        "    console.log('\\n=== CLIENTS DETAIL ===');",
        "    console.log(JSON.stringify(clientDetails, null, 2));",
        "    console.log('\\n=== REPORTS DETAIL ===');",
        "    console.log(JSON.stringify(reportDetails, null, 2));",
        "    console.log('\\n=== SNAPCHAT CONNECTIONS ===');",
        "    console.log(JSON.stringify(snapConns, null, 2));",
        "    console.log('\\n=== X CONNECTIONS ===');",
        "    console.log(JSON.stringify(xConns, null, 2));",
        "    console.log('\\n=== GOOGLE CONNECTIONS ===');",
        "    console.log(JSON.stringify(googleConns, null, 2));",

        "    await prisma.$disconnect();",
        "  } catch(e) { console.error('FAILED:', e.message, e.stack); await prisma.$disconnect(); process.exit(1); }",
        "}",
        "check();"
    ].join('\n');

    conn.sftp((sftpErr, sftp) => {
        if (sftpErr) { console.error('SFTP error:', sftpErr); conn.end(); return; }
        const remotePath = '/tmp/mk_deep_check.js';
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
