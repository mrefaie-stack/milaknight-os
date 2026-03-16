const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== Existing certbot certs ==="',
    'ls /etc/letsencrypt/live/ 2>/dev/null',
    '',
    'echo ""',
    'echo "=== Check if cPanel certs are self-signed (for backend.mila-knight.com) ==="',
    'openssl x509 -in /home/milaknight/ssl/certs/backend_mila_knight_com_bd686_d16db_1799514872_a08adab7c0f33d678c589818000adf88.crt -noout -issuer -subject 2>/dev/null',
    '',
    'echo ""',
    'echo "=== Getting certbot for critical domains ==="',
    // Get certbot certs for the most critical domains
    'certbot certonly --nginx --non-interactive --agree-tos --email admin@mila-knight.com -d backend.mila-knight.com 2>&1',
  ].join('\n');

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\nExit code:', code);
      conn.end();
    }).on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2', readyTimeout: 60000 });
