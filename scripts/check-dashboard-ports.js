const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    // Show all listening ports
    'echo "=== LISTENING PORTS ==="',
    'ss -tlnp 2>/dev/null | head -40',
    // Check Docker status
    'echo ""',
    'echo "=== DOCKER STATUS ==="',
    'docker ps 2>/dev/null | head -30',
    // Check Portainer specifically
    'echo ""',
    'echo "=== PORTAINER CONTAINER ==="',
    'docker ps -a --filter name=portainer 2>/dev/null',
    // Check PM2
    'echo ""',
    'echo "=== PM2 PROCESSES ==="',
    'pm2 list 2>/dev/null',
    // Check nginx config for dashboard proxies
    'echo ""',
    'echo "=== NGINX DASHBOARD CONFIGS ==="',
    'grep -r "portainer\\|dashboard\\|9000\\|9443" /etc/nginx/sites-enabled/ 2>/dev/null | head -30',
    // Check nginx sites enabled
    'echo ""',
    'echo "=== NGINX SITES ENABLED ==="',
    'ls -la /etc/nginx/sites-enabled/ 2>/dev/null',
    // Recent error logs
    'echo ""',
    'echo "=== NGINX ERRORS (last 20) ==="',
    'tail -20 /var/log/nginx/error.log 2>/dev/null',
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream
      .on('close', (code) => {
        console.log('\nExit code:', code);
        conn.end();
      })
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
