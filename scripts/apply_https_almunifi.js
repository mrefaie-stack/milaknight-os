const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const almunifiHttpsConf = `server {
    listen 443 ssl http2;
    server_name dashboard.almunifi.com;

    ssl_certificate /etc/letsencrypt/live/dashboard.almunifi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.almunifi.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    root /home/milaknight/dashboard.almunifi.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires max;
        log_not_found off;
    }

    error_page 404 /index.html;
}
server {
    listen 80;
    server_name dashboard.almunifi.com;
    return 301 https://$host$request_uri;
}
`;

  const cmd = [
    'echo "=== CHECKING IF SSL FILES EXIST ==="',
    'ls -la /etc/letsencrypt/live/dashboard.almunifi.com/fullchain.pem',
    'echo ""',
    'echo "=== APPLYING HTTPS CONFIG ==="',
    `echo '${almunifiHttpsConf}' > /etc/nginx/conf.d/dashboard.almunifi.com.conf`,
    'nginx -t && systemctl reload nginx',
    'echo ""',
    'echo "=== DETAILED GREP FOR API DOMAIN ==="',
    'grep -raE "https?://[a-zA-Z0-9.-]+\\.almunifi\\.com" /home/milaknight/dashboard.almunifi.com/assets | head -n 1',
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
