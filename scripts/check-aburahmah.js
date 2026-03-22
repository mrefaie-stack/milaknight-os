const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    // Check aburahmah main app
    'echo "=== backend_aburahmah app container ==="',
    'docker ps -a | grep aburahmah',
    'echo ""',
    // Try to start it if it exists but stopped
    'echo "=== Check aburahmah compose file ==="',
    'find /root /home -name "docker-compose.yml" 2>/dev/null | xargs grep -l "aburahmah" 2>/dev/null',
    'echo ""',
    'echo "=== Aburahmah API port test ==="',
    'curl -sk -o /dev/null -w "%{http_code}" http://127.0.0.1:9006/ 2>/dev/null',
    'echo ""',
    // Check what the nginx config for backend.aburahmah.com says
    'echo "=== backend.aburahmah.com nginx config ==="',
    'cat /etc/nginx/conf.d/backend.aburahmah.com.conf',
    'echo ""',
    // Check all dashboard folders
    'echo "=== ALL DASHBOARD FOLDERS ==="',
    'for d in /home/milaknight/dashboard.*/; do echo "--- $d ---"; ls "$d" 2>/dev/null | head -5; done',
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
