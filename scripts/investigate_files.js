const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== FOLDERS IN /home/milaknight ==="',
    'ls -la /home/milaknight/ | grep -E "dashboard|backend|back"',
    'echo ""',
    'echo "=== CONTENTS OF backend.aburahmah.com ==="',
    'ls -la /home/milaknight/backend.aburahmah.com/ 2>/dev/null | head -20',
    'echo ""',
    'echo "=== CONTENTS OF dashboard.mila-knight.com ==="',
    'ls -la /home/milaknight/dashboard.mila-knight.com/ 2>/dev/null | head -20',
    'echo ""',
    'echo "=== CONTENTS OF dashboard.drsalehalkhalaf.com (verify what I copied) ==="',
    'ls -la /home/milaknight/dashboard.drsalehalkhalaf.com/ 2>/dev/null | head -20',
    'echo ""',
    'echo "=== NGINX CONF.D LISTING AGAIN ==="',
    'ls -F /etc/nginx/conf.d/',
    'echo ""',
    'echo "=== CHECKING IF backend.aburahmah.com has index.php ==="',
    'ls /home/milaknight/backend.aburahmah.com/public/index.php /home/milaknight/backend.aburahmah.com/index.php 2>/dev/null',
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
