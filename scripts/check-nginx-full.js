const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== NGINX CONF.D LISTING ==="',
    'ls -la /etc/nginx/conf.d/ 2>/dev/null',
    'echo ""',
    'echo "=== ALL NGINX CONFIG FILES ==="',
    'for f in /etc/nginx/conf.d/*.conf; do echo ""; echo "====== $f ======"; cat "$f"; done 2>/dev/null',
    'echo ""',
    'echo "=== APACHE VIRTUAL HOSTS ==="',
    'ls /etc/httpd/conf.d/ 2>/dev/null || ls /etc/apache2/sites-enabled/ 2>/dev/null',
    'echo ""',
    'echo "=== PORT 9104 9105 9106 CONTAINERS ==="',
    'docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}" 2>/dev/null | grep -E "910[4-9]|91[1-9]"',
    'echo ""',
    'echo "=== ALL DOCKER CONTAINERS WITH PORT MAPPING ==="',
    'docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}" 2>/dev/null',
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
