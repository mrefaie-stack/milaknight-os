const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== FIXING PERMISSIONS ==="',
    'chown -R milaknight:milaknight /home/milaknight/dashboard.*',
    'chmod -R 755 /home/milaknight/dashboard.*',
    'chmod 711 /home/milaknight', // Ensure nginx can traverse home
    'echo ""',
    'echo "=== STANDARDIZING SPA ROUTING IN NGINX ==="',
    '# Update all dashboard configs to use /index.html as fallback',
    'sed -i "s/try_files \\$uri \\$uri\\/ \\/index.php?\\$args;/try_files \\$uri \\$uri\\/ \\/index.html;/" /etc/nginx/conf.d/dashboard.aalsaigh.com.conf',
    'sed -i "s/try_files \\$uri \\$uri\\/ \\/index.php?\\$args;/try_files \\$uri \\$uri\\/ \\/index.html;/" /etc/nginx/conf.d/dashboard.aburahmah.com.conf',
    'sed -i "s/try_files \\$uri \\$uri\\/ \\/index.php?\\$args;/try_files \\$uri \\$uri\\/ \\/index.html;/" /etc/nginx/conf.d/dashboard.tba.sa.conf',
    // The ones I just created already have /index.html but double check
    'echo ""',
    'echo "=== NGINX TEST & RELOAD ==="',
    'nginx -t && systemctl reload nginx && echo "RELOAD OK"',
    'echo ""',
    'echo "=== CHECKING BACKEND FILES FOR tba.sa ==="',
    'ls -la /home/milaknight/back.tba.sa/ | grep -i index',
    'echo ""',
    'echo "=== CHECKING BACKEND FILES FOR aalsaigh ==="',
    '# backend.aalsaigh.com is currently a proxy to 9003. Let check elsaigh docker container.',
    'docker ps | grep elsaigh',
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
