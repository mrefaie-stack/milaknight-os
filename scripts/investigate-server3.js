const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('=== Connected ===\n');
  const cmd = `
echo "=== SAMPLE SSL USERDATA ===" && cat /var/cpanel/userdata/milaknight/aroma.mila-knight.com_SSL 2>/dev/null
echo ""
echo "=== SAMPLE SSL USERDATA 2 ===" && cat /var/cpanel/userdata/milaknight/evoque.mila-knight.com_SSL 2>/dev/null
echo ""
echo "=== KEYS DIR ===" && ls /home/milaknight/ssl/keys/ 2>/dev/null | head -20
echo ""
echo "=== WP TOOLKIT CONFIGS ===" && cat /etc/nginx/conf.d/users/milaknight/aroma.mila-knight.com/wp-toolkit.conf 2>/dev/null
echo ""
echo "=== BACKEND MILA KNIGHT CUSTOM CONFIG ===" && cat /etc/nginx/conf.d/users/milaknight/backend.mila-knight.com/custom.conf 2>/dev/null
echo ""
echo "=== APACHE VHOST SAMPLE (aroma) ===" && cat /usr/local/apache/conf/userdata/std/2_4/milaknight/aroma.mila-knight.com/*.conf 2>/dev/null | head -50
echo ""
echo "=== APACHE VHOST SAMPLE SSL (aroma) ===" && cat /usr/local/apache/conf/userdata/ssl/2_4/milaknight/aroma.mila-knight.com/*.conf 2>/dev/null | head -50
echo ""
echo "=== APACHE VHOST MAIN (aroma) ===" && cat /usr/local/apache/conf/userdata/std/2_4/milaknight/*.conf 2>/dev/null | head -50
echo ""
echo "=== CPANEL CERT INSTALL CHECK ===" && cat "/var/cpanel/ssl/installed/certs/$(ls /var/cpanel/ssl/installed/certs/ 2>/dev/null | head -1)" 2>/dev/null | head -5
echo ""
echo "=== FIND AROMA SSL PEM ===" && find /home/milaknight/ssl -name "*.pem" 2>/dev/null | head -5
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
