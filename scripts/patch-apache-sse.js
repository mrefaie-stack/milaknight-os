const { Client } = require('ssh2');

const newConfig = `<VirtualHost 72.61.162.106:80>
    ServerName os.mila-knight.com
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost 72.61.162.106:443>
    ServerName os.mila-knight.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/os.mila-knight.com/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/os.mila-knight.com/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/os.mila-knight.com/chain.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3333/ flushpackets=on
    ProxyPassReverse / http://localhost:3333/

    # Disable gzip compression for SSE streams (gzip buffering breaks streaming)
    SetEnvIf Request_URI "/api/rooms/.*/signals$" no-gzip dont-vary
    SetEnvIf Request_URI "/api/rooms/.*/signals$" proxy-sendchunked=1

    ErrorLog logs/os.mila-knight.com-error_log
    CustomLog logs/os.mila-knight.com-access_log common
</VirtualHost>`;

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');

  // Write the new config
  const writeCmd = `cat > /etc/apache2/conf.d/os_milaknight.conf << 'APACHEEOF'
${newConfig}
APACHEEOF
echo "Config written"
cat /etc/apache2/conf.d/os_milaknight.conf
echo "=== Testing syntax ==="
apachectl -t 2>&1
echo "=== Reloading Apache ==="
systemctl reload httpd 2>/dev/null || systemctl reload apache2 2>/dev/null || apachectl graceful 2>/dev/null
echo "=== Done ==="`;

  conn.exec(writeCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\nDone, exit code:', code);
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
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
