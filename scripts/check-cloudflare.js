const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const cmd = `
    echo "=== Cloudflare check (includes/cloudflare.conf) ===" &&
    cat /etc/apache2/conf.d/includes/cloudflare.conf 2>/dev/null | head -30 &&
    echo "" &&
    echo "=== DNS lookup for os.mila-knight.com ===" &&
    dig +short os.mila-knight.com 2>/dev/null || nslookup os.mila-knight.com 2>/dev/null | grep Address &&
    echo "" &&
    echo "=== Server IP ===" &&
    curl -s ifconfig.me 2>/dev/null || hostname -I
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', (data) => process.stdout.write(data.toString()))
      .stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
