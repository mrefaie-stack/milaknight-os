const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING minnnn/index.php ==="',
    'grep -iE "title|logo" /home/milaknight/drsalehalkhalaf.com/minnnn/index.php 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING minnnn/assets ==="',
    'ls -la /home/milaknight/drsalehalkhalaf.com/minnnn/assets 2>/dev/null | head -n 10',
    'echo ""',
    'echo "=== CHECKING FOR DASHBOARD FILES IN minnnn ==="',
    'find /home/milaknight/drsalehalkhalaf.com/minnnn -name "index.html" 2>/dev/null',
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
