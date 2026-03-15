const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const cmd = `
    echo "=== PM2 status ===" &&
    pm2 list &&
    echo "" &&
    echo "=== Apache config for os.mila-knight.com ===" &&
    grep -E "ProxyPass|flushpackets|SetEnvIf" /etc/apache2/conf.d/os_milaknight.conf &&
    echo "" &&
    echo "=== Test SSE endpoint (should stream, not buffer) ===" &&
    curl -sk -o /dev/null -w "HTTP Status: %{http_code}\\n" https://os.mila-knight.com/api/rooms/heartbeat -X PUT -H "Cookie:" &&
    echo "" &&
    echo "=== TURN server running? ===" &&
    ss -tlnp | grep 3478 || echo "TURN not on 3478" &&
    echo "" &&
    echo "=== Git log on server ===" &&
    cd /root/milaknight-os && git log --oneline -3
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
