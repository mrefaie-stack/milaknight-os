const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== NGINX STATUS ==="',
    'systemctl status nginx --no-pager 2>&1 | head -20',
    'echo ""',
    'echo "=== NGINX TEST ==="',
    'nginx -t 2>&1',
    'echo ""',
    'echo "=== NGINX ERRORS (last 30) ==="',
    'tail -30 /var/log/nginx/error.log 2>/dev/null',
    'echo ""',
    'echo "=== ALL DOCKER CONTAINERS STATUS ==="',
    'docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null',
    'echo ""',
    'echo "=== PM2 STATUS ==="',
    'pm2 list 2>/dev/null',
    'echo ""',
    'echo "=== CURL TEST KEY SITES ==="',
    'curl -sk -o /dev/null -w "dashboard.aalsaigh.com: %{http_code}\n" https://dashboard.aalsaigh.com/ 2>/dev/null',
    'curl -sk -o /dev/null -w "dashboard.tba.sa: %{http_code}\n" https://dashboard.tba.sa/ 2>/dev/null',
    'curl -sk -o /dev/null -w "dashboard.aburahmah.com: %{http_code}\n" https://dashboard.aburahmah.com/ 2>/dev/null',
    'curl -sk -o /dev/null -w "dashboard.drsalehalkhalaf.com: %{http_code}\n" https://dashboard.drsalehalkhalaf.com/ 2>/dev/null',
    'curl -sk -o /dev/null -w "dashboard.mila-knight.com: %{http_code}\n" https://dashboard.mila-knight.com/ 2>/dev/null',
    'curl -sk -o /dev/null -w "portainer.mila-knight.com: %{http_code}\n" https://portainer.mila-knight.com/ 2>/dev/null',
    'curl -sk -o /dev/null -w "os.mila-knight.com: %{http_code}\n" https://os.mila-knight.com/ 2>/dev/null',
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
