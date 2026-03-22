const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== TBA BACKEND LOGS ==="',
    'docker logs --tail 50 tba_backend-app-1',
    'echo ""',
    'echo "=== CHECKING back.tba.sa.conf ==="',
    'cat /etc/nginx/conf.d/back.tba.sa.conf',
    'echo ""',
    'echo "=== CHECKING backend.mila-knight.com.conf ==="',
    'cat /etc/nginx/conf.d/backend.mila-knight.com.conf',
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
