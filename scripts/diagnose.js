const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  // Check .env (masked), prisma status, and pm2 logs
  const cmd = `
    cd milaknight-os && 
    echo "--- .env Check ---" && 
    grep "DATABASE_URL" .env | cut -d'@' -f2 && 
    echo "--- Prisma Status ---" && 
    npx prisma migrate status && 
    echo "--- PM2 Status ---" && 
    pm2 status && 
    echo "--- Recent Logs ---" && 
    pm2 logs milaknight --lines 50 --nostream
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
