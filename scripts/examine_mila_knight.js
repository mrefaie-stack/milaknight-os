const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== FULL INDEX.HTML OF dashboard.mila-knight.com ==="',
    'cat /home/milaknight/dashboard.mila-knight.com/index.html',
    'echo ""',
    'echo "=== CHECKING IF backend.almunifi.com IS REACHABLE ==="',
    'curl -sk -o /dev/null -w "%{http_code}\\n" https://backend.almunifi.com/login',
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
