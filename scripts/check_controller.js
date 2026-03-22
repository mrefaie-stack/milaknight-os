const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== AUTH CONTROLLER IN ELSAIGH ==="',
    'docker exec backend_elsaigh-app-1 cat app/controllers/authentication_controller.rb',
    'echo ""',
    'echo "=== CHECKING RECENTLY CHANGED FILES IN ELSAIGH ==="',
    'docker exec backend_elsaigh-app-1 find . -mtime -2 -type f | grep -v "log/" | head -n 20',
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
