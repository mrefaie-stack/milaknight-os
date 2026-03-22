const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING index.html EXISTENCE ==="',
    'ls -la /home/milaknight/dashboard.almunifi.com/index.html',
    'echo ""',
    'echo "=== FIXING PERMISSIONS RECURSIVELY ==="',
    'chmod 755 /home/milaknight',
    'chmod 755 /home/milaknight/dashboard.almunifi.com',
    'chmod -R 644 /home/milaknight/dashboard.almunifi.com/*',
    'find /home/milaknight/dashboard.almunifi.com -type d -exec chmod 755 {} \\;',
    'echo ""',
    'echo "=== TESTING ACCESS WITH UNPRIVILEGED USER ==="',
    'sudo -u nobody ls -la /home/milaknight/dashboard.almunifi.com/index.html',
    'echo ""',
    'echo "=== RETRYING SSL ==="',
    'certbot certonly --webroot -w /home/milaknight/dashboard.almunifi.com -d dashboard.almunifi.com --non-interactive --agree-tos -m admin@milaknights.com',
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
