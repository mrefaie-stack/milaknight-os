const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING API URL IN ABURAHMAH ASSETS ==="',
    'grep -rE "http" /home/milaknight/dashboard.aburahmah.com/assets/ | grep -v "w3.org" | head -n 5',
    'echo ""',
    'echo "=== CONTENTS OF /home/milaknight/backend.aburahmah.com ==="',
    'ls -la /home/milaknight/backend.aburahmah.com',
    'echo ""',
    'echo "=== CHECKING IF backend.aburahmah.com.conf SHOULD BE PROXY ==="',
    '# Compare with backend.aalsaigh.com.conf for example',
    'cat /etc/nginx/conf.d/backend.aalsaigh.com.conf',
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
