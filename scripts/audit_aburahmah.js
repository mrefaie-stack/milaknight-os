const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== NGINX CONFIG FOR ABURAHMAH DASHBOARD ==="',
    'cat /etc/nginx/conf.d/dashboard.aburahmah.com.conf 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING ABURAHMAH DASHBOARD DIRECTORY ==="',
    'ls -la /home/milaknight/dashboard.aburahmah.com 2>/dev/null',
    'echo ""',
    'echo "=== NGINX CONFIG FOR ABURAHMAH BACKEND ==="',
    'cat /etc/nginx/conf.d/backend.aburahmah.com.conf 2>/dev/null',
    'echo ""',
    'echo "=== CURL TEST FOR ABURAHMAH DASHBOARD ==="',
    'curl -sk -o /dev/null -w "%{http_code}" https://dashboard.aburahmah.com',
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
