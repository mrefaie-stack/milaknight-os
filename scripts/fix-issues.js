const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    // Fix 1: PHP-FPM socket permissions - nginx user needs access to nobody group sockets
    'echo "=== Fix: Add nginx to nobody group ==="',
    'usermod -aG nobody nginx',
    'id nginx',
    '',
    // Fix 2: Check mila-knight.com 500 error
    'echo ""',
    'echo "=== mila-knight.com 500 debug ==="',
    'curl -sk --max-time 5 https://mila-knight.com/ 2>&1 | head -20',
    '',
    // Check if port 9103 is actually responding
    'echo ""',
    'echo "=== Port 9103 check ==="',
    'curl -sk --max-time 5 http://localhost:9103/ 2>&1 | head -5',
    '',
    // Check mila-knight.com public_html vs the docker container
    'echo ""',
    'echo "=== mila-knight.com docroot ==="',
    'ls /home/milaknight/mila-knight.com/ 2>/dev/null | head -10',
    '',
    // Check if WordPress is there
    'echo ""',
    'echo "=== WordPress check ==="',
    'ls /home/milaknight/mila-knight.com/wp-config.php 2>/dev/null && echo "WordPress found" || echo "No WordPress"',
    '',
    // Reload nginx after adding to group
    'echo ""',
    'echo "=== Reload nginx ==="',
    'systemctl reload nginx',
    'echo "nginx reloaded"',
    '',
    // Test WordPress sites after fix
    'sleep 1',
    'echo ""',
    'echo "=== Re-test WordPress sites ==="',
    'curl -sk -o /dev/null -w "aroma.mila-knight.com: %{http_code}\\n" https://aroma.mila-knight.com/',
    'curl -sk -o /dev/null -w "aromav2.mila-knight.com: %{http_code}\\n" https://aromav2.mila-knight.com/',
  ].join('\n');

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\nExit code:', code);
      conn.end();
    }).on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2', readyTimeout: 30000 });
