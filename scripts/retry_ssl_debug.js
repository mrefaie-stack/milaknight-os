const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== RETRYING SSL WITH FULL OUTPUT ==="',
    'certbot certonly --webroot -w /home/milaknight/dashboard.almunifi.com -d dashboard.almunifi.com --non-interactive --agree-tos -m admin@milaknights.com',
    'echo ""',
    'echo "=== CHECKING DIRECTORY EXISTENCE ==="',
    'ls -ld /home/milaknight/dashboard.almunifi.com',
    'echo ""',
    'echo "=== CHECKING FOR ANY CLASHING CONFIGS ==="',
    'grep -r "almunifi" /etc/nginx/conf.d/',
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
