const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING DNS RESOLUTION ==="',
    'host dashboard.almunifi.com || ping -c 1 dashboard.almunifi.com || echo "DNS fail"',
    'echo ""',
    'echo "=== CHECKING NGINX DEFAULT SERVER ==="',
    'grep -r "default_server" /etc/nginx/conf.d/ /etc/nginx/nginx.conf',
    'echo ""',
    'echo "=== CHECKING ALMUNIFI BACKUP CONFIG ==="',
    'ls -la /etc/nginx/conf.d/dashboard.almunifi.com.conf.bak 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING IF backend.almunifi.com RESOLVES ==="',
    'host backend.almunifi.com || echo "Backend DNS fail"',
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
