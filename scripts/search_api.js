const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== API ENDPOINTS IN dashboard.tba.sa ==="',
    'grep -rE "http|backend|api" /home/milaknight/dashboard.tba.sa/assets/ 2>/dev/null | head -5',
    'echo ""',
    'echo "=== API ENDPOINTS IN dashboard.aalsaigh.com ==="',
    'grep -rE "http|backend|api" /home/milaknight/dashboard.aalsaigh.com/assets/ 2>/dev/null | head -5',
    'echo ""',
    'echo "=== CHECKING dashboard.almunifi.com CONFIG ==="',
    'grep -r "dashboard.almunifi.com" /etc/nginx/conf.d/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING NGINX USERS DIR FOR DASHBOARDS ==="',
    'ls -la /etc/nginx/conf.d/users/milaknight/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING ALL NGINX CONFIGS FOR 9002 ==="',
    'grep -r "9002" /etc/nginx/conf.d/ 2>/dev/null',
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
