const { Client } = require('ssh2');

const milaKnightDashboardConf = `server {
    listen 443 ssl http2;
    server_name dashboard.mila-knight.com;

    ssl_certificate /etc/letsencrypt/live/dashboard.mila-knight.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.mila-knight.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    root /home/milaknight/dashboard.mila-knight.com;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
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
    server_name dashboard.mila-knight.com;
    return 301 https://$host$request_uri;
}
`;

const drSalehDashboardConf = `server {
    listen 443 ssl http2;
    server_name dashboard.drsalehalkhalaf.com;

    ssl_certificate /etc/letsencrypt/live/dashboard.drsalehalkhalaf.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.drsalehalkhalaf.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    root /home/milaknight/dashboard.drsalehalkhalaf.com;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
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
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const writeTask = (path, content) => new Promise((resolve, reject) => {
      const ws = sftp.createWriteStream(path);
      ws.write(content, 'utf8', () => ws.end());
      ws.on('close', resolve);
      ws.on('error', reject);
    });

    Promise.all([
      writeTask('/etc/nginx/conf.d/dashboard.mila-knight.com.conf', milaKnightDashboardConf),
      writeTask('/etc/nginx/conf.d/dashboard.drsalehalkhalaf.com.conf', drSalehDashboardConf),
    ]).then(() => {
      console.log('Configs written');
      conn.exec('nginx -t && systemctl reload nginx && echo "RELOAD OK"', (err2, stream) => {
        if (err2) throw err2;
        stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString()));
      });
    }).catch(console.error);
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
