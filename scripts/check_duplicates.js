const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING FOR DUPLICATE SERVER NAMES ==="',
    'grep -r "server_name" /etc/nginx/conf.d/ 2>/dev/null | grep -E "dashboard|backend|back" | sort',
    'echo ""',
    'echo "=== CHECKING IF dashboard.mila-knight.com IS HANDLED ELSEWHERE ==="',
    'grep -r "dashboard.mila-knight.com" /etc/nginx/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING NGINX DEFAULT SERVER ==="',
    'grep -r "default_server" /etc/nginx/ 2>/dev/null',
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
