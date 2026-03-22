const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== LOCATING DASHBOARDS ==="',
    'find /home/milaknight -name "index.html" 2>/dev/null | grep -i "almunifi"',
    'echo ""',
    'echo "=== CHECKING almunifi.com.conf ==="',
    'cat /etc/nginx/conf.d/almunifi.com.conf',
    'echo ""',
    'echo "=== CHECKING backend.almunifi.com.conf ==="',
    'cat /etc/nginx/conf.d/backend.almunifi.com.conf',
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
