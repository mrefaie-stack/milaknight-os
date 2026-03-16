const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    // Full restart nginx to apply group membership
    'echo "=== Restarting nginx (full) ==="',
    'systemctl restart nginx',
    'echo "nginx restarted"',
    '',
    // Check nginx error log for the 403
    'echo ""',
    'echo "=== nginx error log (403 reason) ==="',
    'tail -20 /var/log/nginx/error.log',
    '',
    // Check directory permissions
    'echo ""',
    'echo "=== Directory permissions ==="',
    'ls -la /home/milaknight/ | grep -E "aroma|aromav2"',
    'ls -la /home/milaknight/aroma.mila-knight.com/ | head -10',
    '',
    // Fix permissions - make directories accessible to others (execute = enter directory)
    'echo ""',
    'echo "=== Fixing permissions ==="',
    'chmod o+x /home/milaknight',
    'chmod o+rx /home/milaknight/aroma.mila-knight.com',
    'chmod o+rx /home/milaknight/aromav2.mila-knight.com',
    '',
    // Test again
    'sleep 1',
    'echo ""',
    'echo "=== Re-test ==="',
    'curl -sk -o /dev/null -w "aroma.mila-knight.com: %{http_code}\\n" https://aroma.mila-knight.com/',
    'curl -sk -o /dev/null -w "aromav2.mila-knight.com: %{http_code}\\n" https://aromav2.mila-knight.com/',
    'curl -sk -o /dev/null -w "mila-knight.com: %{http_code}\\n" https://mila-knight.com/',
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
