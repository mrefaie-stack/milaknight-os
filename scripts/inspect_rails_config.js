const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== USER ATTRIBUTES IN ELSAIGH ==="',
    'docker exec backend_elsaigh-app-1 bundle exec rails runner "puts User.column_names"',
    'echo ""',
    'echo "=== PRODUCTION CONFIG IN ELSAIGH ==="',
    'docker exec backend_elsaigh-app-1 cat config/environments/production.rb',
    'echo ""',
    'echo "=== SESSION STORE CONFIG IN ELSAIGH ==="',
    'docker exec backend_elsaigh-app-1 cat config/initializers/session_store.rb 2>/dev/null || echo "No session_store.rb"',
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
