const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING ELSAIGH DB CONFIG ==="',
    'docker exec backend_elsaigh-app-1 cat config/database.yml 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING ELSAIGH DB CONNECTIVITY ==="',
    'docker exec backend_elsaigh-app-1 bundle exec rails db:version 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING ABURAHMAH DB CONNECTIVITY ==="',
    'docker exec backend_aburahmah-app-1 bundle exec rails db:version 2>/dev/null',
    'echo ""',
    'echo "=== SEARCHING FOR dashboard.almunifi.com in ALL NGINX FILES AGAIN ==="',
    'grep -r "almunifi.com" /etc/nginx/conf.d/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING FOR ANY HIDDEN DASHBOARD FOLDERS ==="',
    'ls -la /home/milaknight/.*/ 2>/dev/null | grep dashboard',
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
