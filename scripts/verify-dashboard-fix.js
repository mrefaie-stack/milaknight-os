const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    // Check if dashboard.almunifi.com DNS resolves to our server
    'echo "=== DNS for dashboard.almunifi.com ==="',
    'dig +short dashboard.almunifi.com 2>/dev/null',
    'echo ""',
    // Check aburahmah backend main app
    'echo "=== aburahmah backend app container ==="',
    'docker ps | grep aburahmah',
    'echo ""',
    // Check drsaleh dashboard files
    'echo "=== drsalehalkhalaf dashboard dir contents ==="',
    'ls -la /home/milaknight/dashboard.drsalehalkhalaf.com/',
    'echo ""',
    // Find existing dashboards to copy from (aalsaigh has files)
    'echo "=== aalsaigh dashboard index ==="',
    'head -5 /home/milaknight/dashboard.aalsaigh.com/index.html 2>/dev/null',
    'echo ""',
    // Test the new dashboard config is accessible
    'echo "=== Curl test of dashboard.drsalehalkhalaf.com ==="',
    'curl -sk -o /dev/null -w "%{http_code}" https://dashboard.drsalehalkhalaf.com/ 2>/dev/null || echo "Curl failed"',
    'echo ""',
    'echo "=== All SSL certs now ==="',
    'certbot certificates 2>/dev/null | grep "Domains:" | sort',
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
