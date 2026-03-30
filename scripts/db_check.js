const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Write the check script to server then execute it
    const remoteScript = [
        "const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');",
        "const prisma = new PrismaClient();",
        "async function check() {",
        "  try {",
        "    const users = await prisma.user.count();",
        "    const clients = await prisma.client.count();",
        "    const reports = await prisma.report.count();",
        "    const q = (s) => prisma.$queryRawUnsafe(s);",
        "    const connsByPlatform = await q('SELECT platform, COUNT(*)::int as total, COUNT(CASE WHEN \"isActive\" = true THEN 1 END)::int as active, COUNT(CASE WHEN \"refreshToken\" IS NOT NULL THEN 1 END)::int as has_refresh, COUNT(CASE WHEN \"expiresAt\" < NOW() THEN 1 END)::int as expired FROM \"SocialConnection\" GROUP BY platform ORDER BY platform');",
        "    const orphans = await q('SELECT COUNT(*)::int as count FROM \"SocialConnection\" WHERE \"clientId\" IS NULL AND \"isActive\" = true');",
        "    const expiredActive = await q('SELECT platform, COUNT(*)::int as count FROM \"SocialConnection\" WHERE \"isActive\" = true AND \"expiresAt\" IS NOT NULL AND \"expiresAt\" < NOW() GROUP BY platform');",
        "    const nullExpiry = await q('SELECT platform, COUNT(*)::int as count FROM \"SocialConnection\" WHERE \"isActive\" = true AND \"expiresAt\" IS NULL GROUP BY platform');",
        "    const recentReports = await q('SELECT month, status, COUNT(*)::int as count FROM \"Report\" GROUP BY month, status ORDER BY month DESC LIMIT 20');",
        "    const clientsWithNoConn = await q('SELECT COUNT(*)::int as count FROM \"Client\" c WHERE NOT EXISTS (SELECT 1 FROM \"SocialConnection\" sc WHERE sc.\"clientId\" = c.id AND sc.\"isActive\" = true)');",
        "    const duplicateConns = await q('SELECT \"clientId\", platform, COUNT(*)::int as count FROM \"SocialConnection\" WHERE \"isActive\" = true GROUP BY \"clientId\", platform HAVING COUNT(*) > 1');",
        "    const roles = await q('SELECT role, COUNT(*)::int as count FROM \"User\" GROUP BY role ORDER BY role');",
        "    console.log('=== DATABASE HEALTH CHECK ===');",
        "    console.log('USERS:', users, '| CLIENTS:', clients, '| REPORTS:', reports);",
        "    console.log('USER ROLES:', JSON.stringify(roles));",
        "    console.log('CONNECTIONS BY PLATFORM:', JSON.stringify(connsByPlatform));",
        "    console.log('ORPHAN ACTIVE CONNS (no clientId):', JSON.stringify(orphans));",
        "    console.log('EXPIRED ACTIVE TOKENS:', JSON.stringify(expiredActive));",
        "    console.log('ACTIVE TOKENS WITH NULL EXPIRY:', JSON.stringify(nullExpiry));",
        "    console.log('REPORTS BY MONTH/STATUS:', JSON.stringify(recentReports));",
        "    console.log('CLIENTS WITH ZERO CONNECTIONS:', JSON.stringify(clientsWithNoConn));",
        "    console.log('DUPLICATE CONNECTIONS:', JSON.stringify(duplicateConns));",
        "    await prisma.$disconnect();",
        "  } catch(e) { console.error('FAILED:', e.message); await prisma.$disconnect(); process.exit(1); }",
        "}",
        "check();"
    ].join('\n');

    // Use sftp to write script then exec
    conn.sftp((sftpErr, sftp) => {
        if (sftpErr) { console.error('SFTP error:', sftpErr); conn.end(); return; }
        const remotePath = '/tmp/mk_db_check.js';
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
