const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== ALL DOCKER CONTAINERS ==="',
    'docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Image}}\t{{.Status}}" 2>/dev/null',
    'echo ""',
    'echo "=== CONTAINERS ON PORT 9004-9110 ==="',
    'docker ps --format "{{.Names}} -> {{.Ports}}" 2>/dev/null | grep -E "900[4-9]|90[1-9][0-9]"',
    'echo ""',
    'echo "=== ALL NGINX CONF.D FILES ==="',
    'ls /etc/nginx/conf.d/',
    'echo ""',
    'echo "=== PORTAINER CONFIG ==="',
    'grep -r "portainer" /etc/nginx/conf.d/ 2>/dev/null',
    'echo ""',
    'echo "=== DASHBOARD SUBDOMAINS ==="',
    'grep -r "dashboard" /etc/nginx/conf.d/ 2>/dev/null',
    'echo ""',
    'echo "=== BACKEND/API SUBDOMAINS ==="',
    'grep "server_name" /etc/nginx/conf.d/*.conf 2>/dev/null',
    'echo ""',
    'echo "=== tba dashboard container info ==="',
    'docker inspect tba.sa 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); [print(c[\'NetworkSettings\'][\'Ports\']) for c in d]" 2>/dev/null || echo "No container named tba.sa"',
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
