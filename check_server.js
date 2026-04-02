const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to server...\n');
  conn.exec('pm2 status && echo "---LOGS---" && pm2 logs milaknight --lines 50 --nostream', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('\nDone. Code:', code);
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
