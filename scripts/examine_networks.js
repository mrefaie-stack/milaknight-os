const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== DOCKER NETWORKS ==="',
    'docker network ls',
    'echo ""',
    'echo "=== CONTAINERS BY NETWORK ==="',
    'for net in $(docker network ls --format "{{.Name}}"); do echo "--- Network: $net ---"; docker network inspect $net --format "{{range .Containers}}{{.Name}} {{end}}"; echo ""; done',
    'echo ""',
    'echo "=== CHECKING DB HOST RESOLUTION IN ELSAIGH ==="',
    'docker exec backend_elsaigh-app-1 getent hosts db',
    'echo ""',
    'echo "=== CHECKING DB HOST RESOLUTION IN MILA KNIGHT ==="',
    'docker exec backend_mila_knight-app-1 getent hosts db',
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
