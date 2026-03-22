const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    // Fix 1: Restart aburahmah app container
    'echo "=== Fix 1: Restart aburahmah app ==="',
    'docker start backend_aburahmah-app-1 2>&1',
    'sleep 3',
    'docker ps | grep aburahmah',
    'echo ""',
    // Fix 2: Copy dashboard files from tba.sa (same React app structure) to drsalehalkhalaf
    'echo "=== Fix 2: Copy dashboard files for drsalehalkhalaf ==="',
    'cp -r /home/milaknight/dashboard.tba.sa/. /home/milaknight/dashboard.drsalehalkhalaf.com/',
    'chown -R milaknight:milaknight /home/milaknight/dashboard.drsalehalkhalaf.com/',
    'chmod -R 755 /home/milaknight/dashboard.drsalehalkhalaf.com/',
    'ls /home/milaknight/dashboard.drsalehalkhalaf.com/',
    'echo ""',
    // Test again
    'echo "=== Test dashboard.drsalehalkhalaf.com ==="',
    'curl -sk -o /dev/null -w "%{http_code}" https://dashboard.drsalehalkhalaf.com/',
    'echo ""',
    // Test aburahmah backend
    'sleep 5',
    'echo "=== Test aburahmah backend port ==="',
    'curl -sk -o /dev/null -w "%{http_code}" http://127.0.0.1:9006/ 2>/dev/null',
    'echo ""',
    'echo "=== Docker status ==="',
    'docker ps | grep aburahmah',
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
