const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== DASHBOARD NGINX CONFIGS ==="',
    'for f in /etc/nginx/conf.d/dashboard.*.conf; do echo "--- $f ---"; cat "$f"; done 2>/dev/null',
    'echo ""',
    'echo "=== BACKEND NGINX CONFIGS ==="',
    'for f in /etc/nginx/conf.d/backend.*.conf /etc/nginx/conf.d/back.*.conf; do echo "--- $f ---"; cat "$f"; done 2>/dev/null',
    'echo ""',
    'echo "=== FOLDERS IN /home/milaknight ==="',
    'ls -la /home/milaknight/ 2>/dev/null | grep -E "dashboard|backend|back"',
    'echo ""',
    'echo "=== CHECKING PHP-FPM STATUS ==="',
    'ps aux | grep php-fpm | grep -v grep | head -10',
    'echo ""',
    'echo "=== CHECKING SSL CERTS ON DISK ==="',
    'ls -la /etc/letsencrypt/live/ 2>/dev/null',
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
