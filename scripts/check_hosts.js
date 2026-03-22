const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== /etc/hosts IN backend_elsaigh-app-1 ==="',
    'docker exec backend_elsaigh-app-1 cat /etc/hosts',
    'echo ""',
    'echo "=== /etc/hosts IN backend_mila_knight-app-1 ==="',
    'docker exec backend_mila_knight-app-1 cat /etc/hosts',
    'echo ""',
    'echo "=== CHECKING DB CONTAINER IPs ==="',
    'docker inspect backend_elsaigh-db-1 --format "{{.NetworkSettings.Networks.backend_elsaigh_default.IPAddress}}"',
    'docker inspect backend_mila_knight-db-1 --format "{{.NetworkSettings.Networks.backend_mila_knight_default.IPAddress}}"',
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
