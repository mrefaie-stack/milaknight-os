const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING _redirects FILES ==="',
    'cat /home/milaknight/dashboard.*/_redirects 2>/dev/null',
    'echo ""',
    'echo "=== PM2 LIST ==="',
    'pm2 list 2>/dev/null || echo "PM2 not found"',
    'echo ""',
    'echo "=== NETSTAT -TULPN (91xx ports) ==="',
    'netstat -tulpn | grep 91',
    'echo ""',
    'echo "=== CHECKING tbabackend.mila-knight.com.conf ==="',
    'cat /etc/nginx/conf.d/tbabackend.mila-knight.com.conf',
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
