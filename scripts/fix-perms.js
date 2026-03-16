const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== Fixing dashboard dir permissions ==="',
    'chmod o+rx /home/milaknight/dashboard.aalsaigh.com',
    'chmod o+rx /home/milaknight/dashboard.aburahmah.com',
    'chmod o+rx /home/milaknight/dashboard.tba.sa',
    'chmod o+rx /home/milaknight/back.almunifi.com 2>/dev/null || true',
    'chmod o+rx /home/milaknight/back.tba.sa 2>/dev/null || true',
    'chmod o+rx /home/milaknight/backend.aburahmah.com 2>/dev/null || true',
    'chmod o+rx /home/milaknight/clickup.mila-knight.com 2>/dev/null || true',
    'echo "Done"',
    '',
    // Check aburahmah.com error
    'echo ""',
    'echo "=== aburahmah.com 500 check ==="',
    'curl -sk --max-time 5 http://localhost:9106/ 2>&1 | head -5',
    '',
    'sleep 1',
    'echo ""',
    'echo "=== Re-test dashboards ==="',
    'curl -sk -o /dev/null -w "dashboard.aalsaigh.com: %{http_code}\\n" https://dashboard.aalsaigh.com/',
    'curl -sk -o /dev/null -w "dashboard.aburahmah.com: %{http_code}\\n" https://dashboard.aburahmah.com/',
    'curl -sk -o /dev/null -w "dashboard.tba.sa: %{http_code}\\n" https://dashboard.tba.sa/',
    'curl -sk -o /dev/null -w "aburahmah.com: %{http_code}\\n" https://aburahmah.com/',
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
