const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== LAST 50 NGINX ACCESS LOGS (DASHBOARDS) ==="',
    'grep -E "dashboard|backend|back" /var/log/nginx/access.log | tail -n 50',
    'echo ""',
    'echo "=== CHECKING COOKIE PASSING IN NGINX ==="',
    'grep -r "proxy_pass_header" /etc/nginx/conf.d/ 2>/dev/null',
    'grep -r "proxy_set_header Set-Cookie" /etc/nginx/conf.d/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING NGINX GLOBAL CONFIG FOR COOKIES ==="',
    'cat /etc/nginx/nginx.conf | grep -E "cookie|session|header" -i',
    'echo ""',
    'echo "=== TESTING API LOGIN ENDPOINT MANUALLY (TBA) ==="',
    'curl -I -k https://back.tba.sa/login',
    'echo ""',
    'echo "=== TESTING API LOGIN ENDPOINT MANUALLY (ALSAIGH) ==="',
    'curl -I -k https://backend.aalsaigh.com/auth/login',
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
