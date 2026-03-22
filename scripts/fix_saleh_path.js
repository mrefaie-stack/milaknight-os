const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const salehNginxConf = `server {
    listen 443 ssl http2;
    server_name dashboard.drsalehalkhalaf.com;

    ssl_certificate /etc/letsencrypt/live/dashboard.drsalehalkhalaf.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.drsalehalkhalaf.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    root /home/drsalehalkhalaf/dashboard.drsalehalkhalaf.com;
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
    server_name dashboard.drsalehalkhalaf.com;
    return 301 https://$host$request_uri;
}
`;

  const cmd = [
    `echo '${salehNginxConf}' > /etc/nginx/conf.d/dashboard.drsalehalkhalaf.com.conf`,
    'chmod 755 /home/drsalehalkhalaf',
    'chmod -R 755 /home/drsalehalkhalaf/dashboard.drsalehalkhalaf.com',
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
