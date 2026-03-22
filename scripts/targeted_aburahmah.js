const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== TARGETED API SEARCH IN ABURAHMAH ==="',
    'grep -ra "https://backend.aburahmah.com" /home/milaknight/dashboard.aburahmah.com/assets | head -n 1 || echo "Not found"',
    'echo ""',
    'echo "=== CHECKING IF backend.aburahmah.com IS A RAILS APP FOLDER ==="',
    'ls -F /home/milaknight/backend.aburahmah.com | head -n 20',
    'echo ""',
    'echo "=== CHECKING OTHER BACKEND CONFIGS FOR CONSISTENCY ==="',
    'grep -r "proxy_pass" /etc/nginx/conf.d/backend.*.conf',
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
