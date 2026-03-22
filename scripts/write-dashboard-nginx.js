const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const nginxConf = `server {
    listen 443 ssl http2;
    server_name dashboard.drsalehalkhalaf.com;

    ssl_certificate /etc/letsencrypt/live/dashboard.drsalehalkhalaf.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.drsalehalkhalaf.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    root /home/milaknight/dashboard.drsalehalkhalaf.com;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \\.php$ {
        fastcgi_pass unix:/opt/cpanel/ea-php83/root/usr/var/run/php-fpm/5acd9df890ddff713e0a1121c6b16424f183cb09.sock;
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
    server_name dashboard.drsalehalkhalaf.com;
    return 301 https://$host$request_uri;
}
`;

const conn = new Client();
conn.on('ready', () => {
  // Use sftp to write the file
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const remotePath = '/etc/nginx/conf.d/dashboard.drsalehalkhalaf.com.conf';
    const writeStream = sftp.createWriteStream(remotePath);
    writeStream.write(nginxConf, 'utf8', () => {
      writeStream.end();
    });
    writeStream.on('close', () => {
      console.log('Nginx config written via SFTP');
      // Now test and reload nginx
      conn.exec('nginx -t 2>&1 && systemctl reload nginx 2>&1 && echo "NGINX RELOADED OK"', (err2, stream) => {
        if (err2) throw err2;
        stream
          .on('close', () => conn.end())
          .on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
      });
    });
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
