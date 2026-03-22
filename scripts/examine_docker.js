const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== DOCKER CONTAINER LABELS AND PORTS ==="',
    'docker ps --format "table {{.Names}}\t{{.Labels}}\t{{.Ports}}"',
    'echo ""',
    'echo "=== ELSAIGH BACKEND LOGS (POSTERITY) ==="',
    'docker logs --tail 20 backend_elsaigh-app-1',
    'echo ""',
    'echo "=== MILA KNIGHT BACKEND LOGS ==="',
    'docker logs --tail 20 backend_mila_knight-app-1',
    'echo ""',
    'echo "=== CHECKING FOR CORS HEADERS IN NGINX ==="',
    'grep -r "Access-Control-Allow" /etc/nginx/conf.d/ 2>/dev/null',
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
