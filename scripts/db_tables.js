const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const remoteScript = [
        "const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');",
        "const prisma = new PrismaClient();",
        "async function check() {",
        "  try {",
        "    const tables = await prisma.$queryRawUnsafe(\"SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename\");",
        "    console.log('TABLES:', tables.map(x => x.tablename).join(', '));",
        // Check action plan items table
        "    const apItems = await prisma.$queryRawUnsafe(\"SELECT COUNT(*)::int as count FROM information_schema.tables WHERE table_schema='public'\");",
        "    console.log('TABLE COUNT:', JSON.stringify(apItems));",
        // Check auto-report AI summary issue - look at recent server logs or just check the report
        "    const r = await prisma.$queryRawUnsafe(\"SELECT id, metrics FROM \\\"Report\\\" WHERE id = 'cmn29b6go0003i1koqrocmggh'\");",
        "    if (r[0]) {",
        "      const m = JSON.parse(r[0].metrics);",
        "      console.log('FULL METRICS:', JSON.stringify(m, null, 2));",
        "    }",
        "    await prisma.$disconnect();",
        "  } catch(e) { console.error('FAILED:', e.message); await prisma.$disconnect(); process.exit(1); }",
        "}",
        "check();"
    ].join('\n');

    conn.sftp((sftpErr, sftp) => {
        if (sftpErr) { console.error('SFTP error:', sftpErr); conn.end(); return; }
        const remotePath = '/tmp/mk_tables.js';
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
