const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== SEARCHING FOR SALEH ZIP FILES ==="',
    'find /home/milaknight -name "*saleh*.zip" 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING backend_drsaleeh ENV ==="',
    'docker exec backend_drsaleeh-app-1 env | grep -E "DATABASE|SECRET|HOST"',
    'echo ""',
    'echo "=== LISTING ALL ZIP FILES IN HOME ==="',
    'ls /home/milaknight/*.zip 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING FOR ANY OTHER FOLDERS WITH saleh IN NAME ==="',
    'ls -d /home/milaknight/*saleh* 2>/dev/null',
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
