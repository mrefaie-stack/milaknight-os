const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    // Check backend.aburahmah.com config - it's using PHP-FPM socket but should proxy to docker 9006
    'echo "=== backend.aburahmah.com CURRENT config ==="',
    'cat /etc/nginx/conf.d/backend.aburahmah.com.conf',
    'echo ""',
    // Check dashboard.mila-knight.com - returns 404
    'echo "=== dashboard.mila-knight.com config ==="',
    'cat /etc/nginx/conf.d/dashboard.mila-knight.com.conf',
    'echo ""',
    // docker container for it
    'echo "=== dr_almunifi_dashboard container ports ==="',
    'docker inspect dr_almunifi_dashboard-app-1 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0][\"NetworkSettings\"][\"Ports\"])" 2>/dev/null',
    'echo ""',
    // Check aburahmah backend - is it really a PHP or Docker?
    'echo "=== backend.aburahmah.com is on port ==="',
    'docker ps | grep aburahmah',
    'echo ""',
    // Test aburahmah backend directly
    'curl -sk -o /dev/null -w "port 9006: %{http_code}\n" http://127.0.0.1:9006/ 2>/dev/null',
    'echo ""',
    // Check dashboard.mila-knight.com - what files are there and what port 9002 returns  
    'echo "=== port 9002 test ==="',
    'curl -sk -o /dev/null -w "%{http_code}" http://127.0.0.1:9002/ 2>/dev/null',
    'echo ""',
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
