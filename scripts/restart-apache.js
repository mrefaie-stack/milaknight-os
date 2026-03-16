const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
# Stop Apache cleanly
systemctl stop httpd 2>&1 || true
sleep 2

# Kill any remaining httpd processes
pkill -9 httpd 2>/dev/null || true
sleep 1

# Verify 443 is free
echo "=== Ports after Apache stop ===" && ss -tlnp | grep -E ':443|:8080|:8443' || echo "none"

# Start Apache on new ports
echo "=== Starting Apache ===" && systemctl start httpd
sleep 2

# Check ports again
echo "=== Final port state ===" && ss -tlnp | grep -E ':443|:80|:8080|:8443'

# Start nginx
echo "=== Starting nginx ===" && systemctl start nginx
sleep 1
echo "=== nginx status ===" && systemctl status nginx --no-pager | head -10
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
