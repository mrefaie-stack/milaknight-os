const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected. Installing missing package and rebuilding...\n');
  // Install the missing package, then build, then restart
  conn.exec('cd /root/milaknight-os && npm install @google/generative-ai --save 2>&1 && npm run build 2>&1 && pm2 restart milaknight && pm2 status', { pty: false }, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('\nDone. Exit code:', code);
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
