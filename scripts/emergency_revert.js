const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== EMERGENCY REVERT ==="',
    'if [ -f /etc/nginx/conf.d/backend.aburahmah.com.conf.bak ]; then cp /etc/nginx/conf.d/backend.aburahmah.com.conf.bak /etc/nginx/conf.d/backend.aburahmah.com.conf && echo "Restored backend.aburahmah.com.conf"; fi',
    'if [ -f /etc/nginx/conf.d/dashboard.drsalehalkhalaf.com.conf ]; then rm -f /etc/nginx/conf.d/dashboard.drsalehalkhalaf.com.conf && echo "Removed dashboard.drsalehalkhalaf.com.conf"; fi',
    'echo ""',
    'echo "=== NGINX TEST ==="',
    'nginx -t 2>&1',
    'echo ""',
    'echo "=== NGINX RELOAD ==="',
    'systemctl reload nginx 2>&1 && echo "Nginx reloaded"',
    'echo ""',
    'echo "=== CHECKING CURRENT DASHBOARD CONFIGS ==="',
    'grep -r "proxy_pass" /etc/nginx/conf.d/dashboard.*.conf 2>/dev/null',
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
