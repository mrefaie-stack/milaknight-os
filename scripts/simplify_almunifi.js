const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const almunifiUltraSimpleConf = `server {
    listen 80;
    server_name dashboard.almunifi.com;
    root /home/milaknight/dashboard.almunifi.com;
}
`;

  const cmd = [
    'echo "=== APPLYING ULTRA SIMPLE CONFIG ==="',
    `echo '${almunifiUltraSimpleConf}' > /etc/nginx/conf.d/dashboard.almunifi.com.conf`,
    'nginx -t && systemctl reload nginx',
    'echo ""',
    'echo "=== CHECKING NGINX ERROR LOG ==="',
    'tail -n 20 /var/log/nginx/error.log',
    'echo ""',
    'echo "=== CHECKING FOLDER PERMISSIONS ==="',
    'chmod -R 755 /home/milaknight/dashboard.almunifi.com',
    'ls -ld /home/milaknight/dashboard.almunifi.com',
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
