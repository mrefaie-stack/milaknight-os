const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const migrationScript = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function main() {
      try {
        const reports = await prisma.report.findMany();
        console.log('Found', reports.length, 'reports');
        for (const r of reports) {
          let m = typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
          let changed = false;
          
          const processPlats = (plats) => {
            if (!plats || !plats['x']) return;
            const x = plats['x'];
            // If we have currentFollowers but NO followers (or followers is 0)
            if (x.currentFollowers > 0 && (!x.followers || Number(x.followers) === 0)) {
              x.followers = x.currentFollowers;
              changed = true;
              console.log('Migrated X followers for report', r.id);
            }
          };

          if (m.campaigns) {
            m.campaigns.forEach(c => processPlats(c.platforms));
          } else if (m.platforms) {
            processPlats(m.platforms);
          }

          if (changed) {
            await prisma.report.update({
              where: { id: r.id },
              data: { metrics: JSON.stringify(m) }
            });
          }
        }
        console.log('Migration complete');
      } catch (err) {
        console.error('Migration error:', err);
      } finally {
        await prisma.$disconnect();
      }
    }
    main();
  `;
  
  const cmd = `
    cd milaknight-os && 
    echo "${migrationScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" > scripts/migrate_x_data.js && 
    node scripts/migrate_x_data.js
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
