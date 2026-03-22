const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CONTENTS OF /home/milaknight/drsalehalkhalaf.com ==="',
    'ls -la /home/milaknight/drsalehalkhalaf.com',
    'echo ""',
    'echo "=== CONTENTS OF /home/milaknight/test.drsalehalkhalaf.com ==="',
    'ls -la /home/milaknight/test.drsalehalkhalaf.com',
    'echo ""',
    'echo "=== CHECKING FOR dashboard.zip OR dist.zip IN HOME ==="',
    'find /home/milaknight -name "*.zip" -maxdepth 1 2>/dev/null',
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
