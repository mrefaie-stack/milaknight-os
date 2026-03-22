const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== NGINX CONF.D FILES ==="',
    'ls -la /etc/nginx/conf.d/ 2>/dev/null',
    'echo ""',
    'echo "=== NGINX CONF.D CONTENTS ==="',
    'for f in /etc/nginx/conf.d/*.conf; do echo "--- $f ---"; cat "$f"; echo ""; done 2>/dev/null',
    'echo ""',
    'echo "=== NGINX VERSION & STATUS ==="',
    'nginx -v 2>&1',
    'systemctl status nginx 2>/dev/null | head -15',
    'echo ""',
    'echo "=== APACHE STATUS ==="',
    'systemctl status apache2 2>/dev/null | head -10',
    'echo ""',
    'echo "=== FULL PORTS LISTENING ==="',
    'ss -tlnp 2>/dev/null',
    'echo ""',
    'echo "=== DOCKER NETWORK ==="',
    'docker network ls 2>/dev/null',
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
