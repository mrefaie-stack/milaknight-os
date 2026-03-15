const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const cmd = `cd /root/milaknight-os && git pull origin main && npm run build && pm2 restart milaknight && pm2 status`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Done, exit code:', code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
