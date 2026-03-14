const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('cd /root/milaknight-os && git fetch origin && git reset --hard origin/main && npm ci --production=false && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 restart milaknight || pm2 restart all && pm2 status', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
