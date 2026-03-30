const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const c = new Client();

c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) { console.error(err); c.end(); return; }

        const remoteScript = '/root/milaknight-os/scripts/_dbq_temp.cjs';
        const localScript = path.join(__dirname, '_dbq_temp.cjs');

        // Write local temp script
        fs.writeFileSync(localScript, `
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.client.findMany({ include: { socialConnections: true } })
  .then(r => {
    const found = r.filter(cl => cl.name && (
      cl.name.includes('\u0635\u0627\u064a\u063a') ||
      cl.name.toLowerCase().includes('sayigh') ||
      cl.name.toLowerCase().includes('sayegh') ||
      cl.name.toLowerCase().includes('alsayigh') ||
      cl.name.toLowerCase().includes('saigh') ||
      cl.name.toLowerCase().includes('dr s')
    ));
    if (found.length === 0) {
      console.log('NOT FOUND. All clients:');
      r.forEach(cl => console.log(' -', cl.name));
    } else {
      found.forEach(cl => {
        console.log('=== CLIENT:', cl.name, '| id:', cl.id);
        cl.socialConnections.forEach(sc => {
          const meta = sc.metadata ? JSON.parse(sc.metadata) : {};
          console.log('  PLATFORM:', sc.platform);
          console.log('    platformAccountId:', sc.platformAccountId);
          console.log('    platformAccountName:', sc.platformAccountName);
          console.log('    isActive:', sc.isActive);
          console.log('    userId:', sc.userId);
          console.log('    clientId:', sc.clientId);
          console.log('    meta:', JSON.stringify(meta));
          console.log('    updatedAt:', sc.updatedAt);
        });
      });
    }
  })
  .catch(e => console.error('DB ERROR:', e.message))
  .finally(() => p.\$disconnect());
`);

        sftp.fastPut(localScript, remoteScript, {}, (err2) => {
            fs.unlinkSync(localScript);
            if (err2) { console.error('sftp put error:', err2); c.end(); return; }

            c.exec(`cd /root/milaknight-os && NODE_PATH=/root/milaknight-os/node_modules node ${remoteScript}`, (err3, stream) => {
                let out = '';
                stream.on('data', d => out += d);
                stream.stderr.on('data', d => out += d);
                stream.on('close', () => {
                    console.log(out);
                    // cleanup remote file
                    c.exec(`rm -f ${remoteScript}`, (e, s) => { s.resume(); s.on('close', () => c.end()); });
                });
            });
        });
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
