const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== SEARCHING FOR ALMUNIFI DASHBOARD FILES ==="',
    'find /home/milaknight -maxdepth 2 -type d -name "*almunifi*" 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING CONTENTS OF ALMUNIFI FOLDERS ==="',
    'ls -la /home/milaknight/almunifi.com/ 2>/dev/null | head -5',
    'ls -la /home/milaknight/back.almunifi.com/ 2>/dev/null | head -5',
    'ls -la /home/milaknight/backend.almunifi.com/ 2>/dev/null | head -5',
    'echo ""',
    'echo "=== CHECKING EXISTING SSL CERTS FOR ALMUNIFI ==="',
    'ls /etc/letsencrypt/live/ | grep almunifi',
    'echo ""',
    'echo "=== CHECKING FOR ANY OTHER DASHBOARD FOLDERS ==="',
    'ls -d /home/milaknight/dashboard.*/ 2>/dev/null',
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
