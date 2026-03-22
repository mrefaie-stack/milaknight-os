const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== dashboard.mila-knight.com config ==="',
    'cat /etc/nginx/conf.d/dashboard.mila-knight.com.conf',
    'echo ""',
    'echo "=== dashboard.mila-knight.com files ==="',
    'ls -la /home/milaknight/dashboard.mila-knight.com/ 2>/dev/null',
    'echo ""',
    'echo "=== clickup.mila-knight.com config ==="',
    'cat /etc/nginx/conf.d/clickup.mila-knight.com.conf',
    'echo ""',
    'echo "=== aburahmah backend container status ==="',
    'docker ps --filter name=aburahmah 2>/dev/null',
    'echo ""',
    'echo "=== CHECK PHP-FPM SOCKETS EXIST ==="',
    'ls /opt/cpanel/ea-php83/root/usr/var/run/php-fpm/ 2>/dev/null | head -20',
    'echo ""',
    'echo "=== DASHBOARD PHP-FPM SOCKET TEST ==="',
    'stat /opt/cpanel/ea-php83/root/usr/var/run/php-fpm/5acd9df890ddff713e0a1121c6b16424f183cb09.sock 2>/dev/null && echo "TBA socket OK" || echo "TBA socket MISSING"',
    'stat /opt/cpanel/ea-php83/root/usr/var/run/php-fpm/544287a57b5a693985cc818071742493b17489dd.sock 2>/dev/null && echo "ABURAHMAH socket OK" || echo "ABURAHMAH socket MISSING"',
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
