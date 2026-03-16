const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
echo "=== Apache port config ===" && grep -r "Listen " /etc/apache2/ /usr/local/apache/conf/ 2>/dev/null | grep -v '#' | head -20
echo ""
echo "=== WHM tweak settings ===" && grep -i "apache_port\\|apache_ssl_port" /var/cpanel/cpanel.config 2>/dev/null
echo ""
echo "=== Setting apache ssl port to 8443 ===" && whmapi1 set_tweaksetting key=apache_ssl_port value=8443
echo ""
echo "=== Rebuilding httpd config ===" && /usr/local/cpanel/scripts/rebuildhttpdconf
echo ""
echo "=== Restarting Apache ===" && systemctl restart httpd
echo ""
echo "=== Checking ports ===" && ss -tlnp | grep -E ':443|:80|:8080|:8443'
  `.trim();

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\nExit code:', code);
      conn.end();
    }).on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2', readyTimeout: 30000 });
