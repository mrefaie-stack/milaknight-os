const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CURL TEST FOR ALMUNIFI DASHBOARD ==="',
    'curl -sk https://dashboard.almunifi.com/ar | head -c 500',
    'echo ""',
    'echo "=== CURL TEST FOR ALMUNIFI BACKEND ==="',
    'curl -sk https://backend.almunifi.com/health || curl -sk -o /dev/null -w "%{http_code}" https://backend.almunifi.com',
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream
      .on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
