const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== SEARCHING FOR DASHBOARD FOLDERS IN WP-CONTENT ==="',
    'find /home/milaknight/test.drsalehalkhalaf.com/wp-content -name "*dashboard*" -type d 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING FOR ZIP FILES ANYWHERE IN HOME ==="',
    'find /home/milaknight -maxdepth 2 -name "*.zip" 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING /home/milaknight/minnnn (from Saleh folder) ==="',
    'ls -la /home/milaknight/drsalehalkhalaf.com/minnnn 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING /home/milaknight/558443 (from test folder) ==="',
    'ls -la /home/milaknight/test.drsalehalkhalaf.com/558443 2>/dev/null',
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
