const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING API URL IN tba.sa ==="',
    'grep -rE "https?://(back|backend)" /home/milaknight/dashboard.tba.sa/assets/ 2>/dev/null | head -5',
    'echo ""',
    'echo "=== CHECKING API URL IN aalsaigh ==="',
    'grep -rE "https?://(back|backend)" /home/milaknight/dashboard.aalsaigh.com/assets/ 2>/dev/null | head -5',
    'echo ""',
    'echo "=== CHECKING BACKEND STATUS ==="',
    'curl -sk -o /dev/null -w "back.tba.sa: %{http_code}\\n" https://back.tba.sa/login 2>/dev/null',
    'curl -sk -o /dev/null -w "backend.aalsaigh.com: %{http_code}\\n" https://backend.aalsaigh.com/login 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING NGINX LOGS FOR BACKEND ERRORS ==="',
    'tail -n 20 /var/log/nginx/error.log',
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
