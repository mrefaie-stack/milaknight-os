const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING dashboard.mila-knight.com FILE CONTENTS ==="',
    'ls -la /home/milaknight/dashboard.mila-knight.com/',
    'echo ""',
    'echo "=== CHECKING dashboard.almunifi.com FILE PATHS AGAIN ==="',
    'ls -la /home/milaknight/ | grep almunifi',
    'echo ""',
    'echo "=== CHECKING SSL FOR dashboard.drsalehalkhalaf.com ==="',
    'ls -la /etc/letsencrypt/live/dashboard.drsalehalkhalaf.com/ 2>/dev/null',
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
