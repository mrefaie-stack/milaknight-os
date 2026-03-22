const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const almunifiPort80Conf = `server {
    listen 80;
    server_name dashboard.almunifi.com;
    root /home/milaknight/dashboard.almunifi.com;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;

  const cmd = [
    'echo "=== ENABLING PORT 80 FOR SSL CHALLENGE ==="',
    `echo '${almunifiPort80Conf}' > /etc/nginx/conf.d/dashboard.almunifi.com.conf`,
    'nginx -t && systemctl reload nginx',
    'echo ""',
    'echo "=== ISSUING SSL CERTIFICATE ==="',
    'certbot certonly --webroot -w /home/milaknight/dashboard.almunifi.com -d dashboard.almunifi.com --non-interactive --agree-tos -m admin@milaknights.com || echo "Certbot failed"',
    'echo ""',
    'echo "=== CHECKING FOR BACKEND SUBDOMAIN IN DASHBOARD ASSETS ==="',
    'grep -ra "http" /home/milaknight/dashboard.almunifi.com/assets | grep -v "w3.org" | head -n 5',
    'echo ""',
    'echo "=== CHECKING IF backend.almunifi.com IS NECESSARY ==="',
    'docker exec dr_almunifi_dashboard-app-1 env | grep HOST',
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
