const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== SEARCHING APACHE FOR DASHBOARD ==="',
    'grep -r "dashboard" /etc/apache2/ 2>/dev/null | grep "ServerName" | head -20',
    'echo ""',
    'echo "=== SEARCHING ALL CONFIGS FOR drsalehalkhalaf dashboard ==="',
    'grep -r "dashboard.drsalehalkhalaf.com" /etc/ 2>/dev/null | grep -v "letsencrypt" | head -20',
    'echo ""',
    'echo "=== LISTING /etc/apache2/conf.d/ ==="',
    'ls -la /etc/apache2/conf.d/ 2>/dev/null | head -30',
    'echo ""',
    'echo "=== CHECKING /var/www/vhosts/ ==="',
    'ls -la /var/www/vhosts/ 2>/dev/null',
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
