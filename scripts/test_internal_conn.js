const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== PINGING DB FROM ELSAIGH APP ==="',
    'docker exec backend_elsaigh-app-1 ping -c 1 db',
    'echo ""',
    'echo "=== TESTING PG CONNECTION FROM ELSAIGH APP ==="',
    'docker exec backend_elsaigh-app-1 pg_isready -h db -U postgres',
    'echo ""',
    'echo "=== CHECKING REDIS FROM ELSAIGH APP ==="',
    'docker exec backend_elsaigh-app-1 redis-cli -h redis ping',
    'echo ""',
    'echo "=== CHECKING RAILS LOGS FOR AUTH DETAILS ==="',
    'docker exec backend_elsaigh-app-1 tail -n 50 log/production.log',
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
