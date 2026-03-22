const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== dashboard.mila-knight.com ==="',
    'cat /etc/nginx/conf.d/dashboard.mila-knight.com.conf 2>/dev/null',
    'echo ""',
    'echo "=== dashboard.aalsaigh.com ==="',
    'cat /etc/nginx/conf.d/dashboard.aalsaigh.com.conf 2>/dev/null',
    'echo ""',
    'echo "=== dashboard.aburahmah.com ==="',
    'cat /etc/nginx/conf.d/dashboard.aburahmah.com.conf 2>/dev/null',
    'echo ""',
    'echo "=== dashboard.tba.sa ==="',
    'cat /etc/nginx/conf.d/dashboard.tba.sa.conf 2>/dev/null',
    'echo ""',
    'echo "=== DASHBOARD FILES ON DISK ==="',
    'ls -la /home/milaknight/ 2>/dev/null | grep dashboard',
    'echo ""',
    'echo "=== DASHBOARD INDEX FILES ==="',
    'ls /home/milaknight/dashboard.aalsaigh.com/ 2>/dev/null | head -10',
    'ls /home/milaknight/dashboard.aburahmah.com/ 2>/dev/null | head -10',
    'ls /home/milaknight/dashboard.tba.sa/ 2>/dev/null | head -10',
    'echo ""',
    'echo "=== NGINX TEST ==="',
    'nginx -t 2>&1',
    'echo ""',
    'echo "=== RECENT NGINX ACCESS LOG (dashboard) ==="',
    'grep "dashboard" /var/log/nginx/access.log 2>/dev/null | tail -20 || echo "No matches or no log file"',
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
