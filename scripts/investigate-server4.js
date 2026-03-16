const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('=== Connected ===\n');
  const cmd = `
echo "=== SSL DB ===" && cat /home/milaknight/ssl/ssl.db 2>/dev/null
echo ""
echo "=== ALL KEYS ===" && ls /home/milaknight/ssl/keys/ 2>/dev/null
  `.trim();

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\n=== Done, exit code:', code, '===');
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
  password: ';hdFJ6C1?YYc6FD8gdY2',
  readyTimeout: 30000
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});
