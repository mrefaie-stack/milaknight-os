const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const tbaProxyConf = `server {
    listen 443 ssl http2;
    server_name back.tba.sa;

    ssl_certificate /home/milaknight/ssl/certs/back_tba_sa_9afb2_238cd_1802802012_7a40c45ec25c304b036eb93b2f37b735.crt;
    ssl_certificate_key /home/milaknight/ssl/keys/9afb2_238cd_88ddc4e1a8c862d0889f7f4927530b6f.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://127.0.0.1:9004;
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
    server_name back.tba.sa;
    return 301 https://$host$request_uri;
}
`;

  const cmd = [
    `echo '${tbaProxyConf}' > /etc/nginx/conf.d/back.tba.sa.conf`,
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
