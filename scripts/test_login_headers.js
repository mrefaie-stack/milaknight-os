const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== TESTING LOGIN POST FOR aalsaigh ==="',
    '# Try a dummy login to see headers',
    'curl -i -k -X POST -H "Content-Type: application/json" -d \'{"email":"test@example.com","password":"password"}\' https://backend.aalsaigh.com/auth/login',
    'echo ""',
    'echo "=== TESTING LOGIN POST FOR tba ==="',
    'curl -i -k -X POST -H "Content-Type: application/json" -d \'{"email":"test@example.com","password":"password"}\' https://back.tba.sa/login',
    'echo ""',
    'echo "=== CHECKING REDIS CONNECTIVITY FOR BACKENDS ==="',
    'docker exec backend_elsaigh-app-1 redis-cli -h redis -p 6379 ping 2>/dev/null || echo "Redis ping failed for elsaigh"',
    'docker exec backend_mila_knight-app-1 redis-cli -h redis -p 6379 ping 2>/dev/null || echo "Redis ping failed for mila-knight"',
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
