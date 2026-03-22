const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== MOVING ALMUNIFI CONFIG TO BACKUP ==="',
    'mv /etc/nginx/conf.d/dashboard.almunifi.com.conf /etc/nginx/conf.d/dashboard.almunifi.com.conf.bak',
    'echo ""',
    'echo "=== TESTING NGINX AGAIN ==="',
    'nginx -t && systemctl reload nginx',
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
