const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== FIXING PERMISSIONS PROPERLY ==="',
    'chown -R milaknight:milaknight /home/milaknight/dashboard.*',
    'chmod -R 755 /home/milaknight/dashboard.*',
    'chmod 711 /home/milaknight',
    'echo "Permissions fixed."',
    'echo ""',
    'echo "=== SYNCING NGINX SPA ROUTING ==="',
    'sed -i "s/try_files \\$uri \\$uri\\/ \\/index.php?\\$args;/try_files \\$uri \\$uri\\/ \\/index.html;/" /etc/nginx/conf.d/dashboard.aalsaigh.com.conf',
    'sed -i "s/try_files \\$uri \\$uri\\/ \\/index.php?\\$args;/try_files \\$uri \\$uri\\/ \\/index.html;/" /etc/nginx/conf.d/dashboard.aburahmah.com.conf',
    'sed -i "s/try_files \\$uri \\$uri\\/ \\/index.php?\\$args;/try_files \\$uri \\$uri\\/ \\/index.html;/" /etc/nginx/conf.d/dashboard.tba.sa.conf',
    'echo "Nginx files updated."',
    'echo ""',
    'echo "=== NGINX TEST & RELOAD ==="',
    'nginx -t && systemctl reload nginx && echo "RELOAD OK"',
    'echo ""',
    'echo "=== SEARCHING FOR ALL DASHBOARDS IN /home/milaknight ==="',
    'find /home/milaknight -name "index.html" -path "*/dashboard*/*" 2>/dev/null',
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
