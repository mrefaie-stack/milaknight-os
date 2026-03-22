const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== DASHBOARDS: FILE VS PROXY ==="',
    'grep -E "root|proxy_pass" /etc/nginx/conf.d/dashboard.*.conf',
    'echo ""',
    'echo "=== BACKENDS: FILE VS PROXY ==="',
    'grep -E "root|proxy_pass" /etc/nginx/conf.d/backend.*.conf /etc/nginx/conf.d/back.*.conf',
    'echo ""',
    'echo "=== SEARCHING FOR dashboard.almunifi.com in ALL FILES ==="',
    'grep -r "dashboard.almunifi.com" /etc/nginx/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING /home/milaknight/dashboard.mila-knight.com CONTENT ==="',
    'ls -la /home/milaknight/dashboard.mila-knight.com/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING FOR ANY .env FILES IN DASHBOARDS ==="',
    'find /home/milaknight/dashboard.* -name ".env" 2>/dev/null',
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
