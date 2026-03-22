const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== EXISTING SSL CERTS ==="',
    'ls /etc/letsencrypt/live/ 2>/dev/null',
    'echo ""',
    'echo "=== DASHBOARD DIRS ON DISK ==="',
    'ls /home/milaknight/ 2>/dev/null | grep dashboard',
    'echo ""',
    'echo "=== WHATS IN drsaleh dashboard dir ==="',
    'ls /home/milaknight/dashboard.drsalehalkhalaf.com/ 2>/dev/null | head -10',
    'echo ""',
    'echo "=== DNS CHECK: dashboard.drsalehalkhalaf.com ==="',
    'dig +short dashboard.drsalehalkhalaf.com 2>/dev/null || host dashboard.drsalehalkhalaf.com 2>/dev/null',
    'echo ""',
    'echo "=== DNS CHECK: dashboard.almunifi.com ==="',
    'dig +short dashboard.almunifi.com 2>/dev/null || host dashboard.almunifi.com 2>/dev/null',  
    'echo ""',
    'echo "=== CERTBOT CERTIFICATES STATUS ==="',
    'certbot certificates 2>/dev/null | grep -E "Domains:|Expiry|VALID|INVALID" | head -60',
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
