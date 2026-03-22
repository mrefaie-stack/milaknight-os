const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const almunifiBackendHttpsConf = `server {
    listen 443 ssl http2;
    server_name backend.almunifi.com;

    ssl_certificate /etc/letsencrypt/live/backend.almunifi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/backend.almunifi.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://127.0.0.1:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
server {
    listen 80;
    server_name backend.almunifi.com;
    return 301 https://$host$request_uri;
}
`;

  const cmd = [
    'echo "=== ENABLING PORT 80 FOR BACKEND SSL CHALLENGE ==="',
    'echo "server { listen 80; server_name backend.almunifi.com; root /home/milaknight/dashboard.almunifi.com; }" > /etc/nginx/conf.d/backend.almunifi.com.conf',
    'nginx -t && systemctl reload nginx',
    'echo ""',
    'echo "=== ISSUING BACKEND SSL CERTIFICATE ==="',
    'certbot certonly --webroot -w /home/milaknight/dashboard.almunifi.com -d backend.almunifi.com --non-interactive --agree-tos -m admin@milaknights.com',
    'echo ""',
    'echo "=== APPLYING BACKEND HTTPS CONFIG ==="',
    `echo '${almunifiBackendHttpsConf}' > /etc/nginx/conf.d/backend.almunifi.com.conf`,
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
