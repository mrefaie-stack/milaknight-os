const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING ASSETS IN SALEH DASHBOARD ==="',
    'ls -la /home/milaknight/dashboard.drsalehalkhalaf.com/assets 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING index-fC1ZNW6z.js (TBA clone) ==="',
    'grep -i "tba" /home/milaknight/dashboard.drsalehalkhalaf.com/assets/index-fC1ZNW6z.js 2>/dev/null | head -c 100',
    'echo ""',
    'echo "=== SEARCHING FOR SALEH IN ALL ASSETS ==="',
    'grep -ra "saleh" /home/milaknight/dashboard.*/assets/ 2>/dev/null | head -n 5',
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
