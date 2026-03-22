const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== VERIFYING DASHBOARD ACCESSIBILITY ==="',
    'curl -sk -o /dev/null -w "dashboard.mila-knight.com: %{http_code}\\n" https://dashboard.mila-knight.com/',
    'curl -sk -o /dev/null -w "dashboard.drsalehalkhalaf.com: %{http_code}\\n" https://dashboard.drsalehalkhalaf.com/',
    'curl -sk -o /dev/null -w "dashboard.tba.sa: %{http_code}\\n" https://dashboard.tba.sa/',
    'curl -sk -o /dev/null -w "dashboard.aalsaigh.com: %{http_code}\\n" https://dashboard.aalsaigh.com/',
    'echo ""',
    'echo "=== CHECKING BACKEND LOGS (ELSAIGH) ==="',
    'docker logs --tail 20 backend_elsaigh-app-1',
    'echo ""',
    'echo "=== CHECKING BACKEND LOGS (MILA KNIGHT) ==="',
    'docker logs --tail 20 backend_mila_knight-app-1',
    'echo ""',
    'echo "=== CHECKING PHP LOGS FOR back.tba.sa ==="',
    'tail -n 20 /home/milaknight/back.tba.sa/error_log 2>/dev/null',
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
