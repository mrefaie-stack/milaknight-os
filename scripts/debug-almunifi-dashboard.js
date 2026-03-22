const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== dr_almunifi_dashboard app container logs ==="',
    'docker logs --tail 30 dr_almunifi_dashboard-app-1 2>&1',
    'echo ""',
    'echo "=== port 9002 direct test ==="',
    'curl -sk -v http://127.0.0.1:9002/ 2>&1 | head -40',
    'echo ""',
    'echo "=== almunifi dashboard container env ==="',
    'docker exec dr_almunifi_dashboard-app-1 env 2>/dev/null | grep -E "PORT|HOST|RAILS_ENV|APP" | head -20',
    'echo ""',
    'echo "=== almunifi dashboard - what routes exist ==="',
    'curl -sk http://127.0.0.1:9002/health 2>/dev/null',
    'curl -sk http://127.0.0.1:9002/api 2>/dev/null | head -20',
    'curl -sk http://127.0.0.1:9002/login 2>/dev/null | head -5',
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
