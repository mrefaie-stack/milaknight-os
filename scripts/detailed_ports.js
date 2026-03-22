const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== ALL DOCKER CONTAINERS AND PORTS (DETAILED) ==="',
    'docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"',
    'echo ""',
    'echo "=== CHECKING PORT 9101 ==="',
    'docker ps --filter "publish=9101"',
    'echo ""',
    'echo "=== CHECKING PORT 9100 ==="',
    'docker ps --filter "publish=9100"',
    'echo ""',
    'echo "=== CHECKING PORT 9103 ==="',
    'docker ps --filter "publish=9103"',
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
