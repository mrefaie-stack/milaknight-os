const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const inspectScript = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function main() {
      try {
        const reports = await prisma.report.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' }
        });
        reports.forEach(r => {
          console.log('Report ID:', r.id, 'Month:', r.month);
          try {
            const m = typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
            const platforms = m.campaigns ? m.campaigns[0].platforms : m.platforms;
            if (platforms && platforms['x']) {
              console.log('X Metrics:', JSON.stringify(platforms['x']));
            } else {
              console.log('X not found');
            }
          } catch (e) {
            console.error('Error parsing metrics');
          }
        });
      } catch (err) {
        console.error('Database error:', err);
      } finally {
        await prisma.$disconnect();
      }
    }
    main();
  `;
  
  const cmd = `
    cd milaknight-os && 
    echo "${inspectScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" > scripts/inspect_data.js && 
    node scripts/inspect_data.js
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
