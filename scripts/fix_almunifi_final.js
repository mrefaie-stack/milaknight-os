const { Client } = require('ssh2');

const almunifiDashboardConf = `server {
    listen 443 ssl http2;
    server_name dashboard.almunifi.com;

    ssl_certificate /etc/letsencrypt/live/dashboard.almunifi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.almunifi.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    root /home/milaknight/back.almunifi.com;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \\.php$ {
        fastcgi_pass unix:/opt/cpanel/ea-php83/root/usr/var/run/php-fpm/1427d0d9cf7808cedb69bac6c5429ce00fe7aede.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires max;
        log_not_found off;
    }

    location ~ /\\.ht {
        deny all;
    }
}
server {
    listen 80;
    server_name dashboard.almunifi.com;
    return 301 https://$host$request_uri;
}
`;

const conn = new Client();
conn.on('ready', () => {
  const setupCmd = [
    'echo "=== STEP 1: ISSUING SSL FOR dashboard.almunifi.com ==="',
    'certbot certonly --nginx -d dashboard.almunifi.com --non-interactive --agree-tos --email admin@mila-knight.com 2>/dev/null',
    'echo "SSL issued."',
  ].join(' && ');

  conn.exec(setupCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.sftp((err2, sftp) => {
        if (err2) throw err2;
        const remotePath = '/etc/nginx/conf.d/dashboard.almunifi.com.conf';
        const ws = sftp.createWriteStream(remotePath);
        ws.write(almunifiDashboardConf, 'utf8', () => ws.end());
        ws.on('close', () => {
          console.log('Almunifi config written');
          conn.exec('nginx -t && systemctl reload nginx && echo "FINAL RELOAD OK"', (err3, stream3) => {
            if (err3) throw err3;
            stream3.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString()));
          });
        });
      });
    }).on('data', d => process.stdout.write(d.toString()));
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
