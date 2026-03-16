const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('=== Connected ===\n');
  const cmd = `
echo "=== PHP-FPM POOL LISTEN SOCKETS ===" && for f in /opt/cpanel/ea-php83/root/etc/php-fpm.d/*.conf; do echo "--- $f ---"; grep -E "^(listen|\\[)" "$f" | head -5; done
echo ""
echo "=== SSL CERTS IN HOME ===" && ls /home/milaknight/ssl/ 2>/dev/null && ls /home/milaknight/ssl/certs/ 2>/dev/null
echo ""
echo "=== NGINX USERS DIR ===" && find /etc/nginx/conf.d/users -type f 2>/dev/null | head -30
echo ""
echo "=== CPANEL APACHE VHOST CONFIGS ===" && ls /usr/local/apache/conf/userdata/ 2>/dev/null && ls /etc/apache2/conf.d/userdata/ 2>/dev/null
echo ""
echo "=== LETSENCRYPT CERTS ===" && ls /etc/letsencrypt/live/ 2>/dev/null
echo ""
echo "=== CPANEL INSTALLED SSL ===" && find /var/cpanel/ssl/installed -name "*.crt" 2>/dev/null | head -30
echo ""
echo "=== CPANEL DOMAIN SSL CHECK ===" && ls /home/milaknight/ssl/ 2>/dev/null
echo ""
echo "=== CPANEL CERT DETAILS ===" && cat /var/cpanel/userdata/milaknight/main 2>/dev/null | head -30
echo ""
echo "=== CPANEL USERDATA ===" && ls /var/cpanel/userdata/milaknight/ 2>/dev/null
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
