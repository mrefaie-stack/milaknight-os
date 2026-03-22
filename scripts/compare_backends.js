const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== LS BACKEND ABURAHMAH ==="',
    'ls -la /home/milaknight/backend.aburahmah.com',
    'echo ""',
    'echo "=== LS BACKEND AALSAIGH (EXAMPLE) ==="',
    'ls -la /home/milaknight/backend.aalsaigh.com',
    'echo ""',
    'echo "=== GREP API FROM ABURAHMAH DASHBOARD ASSETS ==="',
    'grep -ra "https" /home/milaknight/dashboard.aburahmah.com/assets | grep "backend" | head -n 1',
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
