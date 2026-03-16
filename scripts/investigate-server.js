const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('=== Connected ===\n');
  const cmd = `
echo "=== DOCKER CONTAINERS ===" && docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Image}}" 2>/dev/null || echo "docker not accessible"
echo ""
echo "=== NGINX CONF FILES ===" && ls -la /etc/nginx/conf.d/ 2>/dev/null
echo ""
echo "=== NGINX SITES AVAILABLE ===" && ls -la /etc/nginx/sites-available/ 2>/dev/null || echo "no sites-available"
echo ""
echo "=== PHP-FPM SOCKETS ===" && ls /var/run/ | grep php 2>/dev/null && find /opt/cpanel -name "*.sock" 2>/dev/null | head -30
echo ""
echo "=== PHP-FPM POOL CONFIGS ===" && ls /opt/cpanel/ea-php83/root/etc/php-fpm.d/ 2>/dev/null | grep -v default
echo ""
echo "=== HOME MILAKNIGHT DIRS ===" && ls /home/milaknight/ 2>/dev/null
echo ""
echo "=== EXISTING NGINX MAIN CONF ===" && cat /etc/nginx/nginx.conf 2>/dev/null | head -50
echo ""
echo "=== CONF.D CONTENTS ===" && for f in /etc/nginx/conf.d/*.conf; do echo "--- $f ---"; cat "$f"; echo ""; done
echo ""
echo "=== SSL CERTS ===" && ls /etc/letsencrypt/live/ 2>/dev/null || ls /var/cpanel/ssl/apache_tls/ 2>/dev/null | head -30 || echo "checking cpanel ssl" && ls /etc/cpanel_ssl/ 2>/dev/null
echo ""
echo "=== CPANEL SSL PATHS ===" && find /var/cpanel/ssl -name "*.crt" 2>/dev/null | head -20
echo ""
echo "=== DOCKER INSPECT PORTS ===" && docker ps -q 2>/dev/null | xargs -I{} docker port {} 2>/dev/null
  `.trim();

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\n=== Done, exit code:', code, '===');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2',
  readyTimeout: 30000
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});
