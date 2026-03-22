const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== FULL NGINX CONF.D TREE ==="',
    'ls -R /etc/nginx/conf.d/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING users/ directory ==="',
    'ls -la /etc/nginx/conf.d/users/ 2>/dev/null',
    'echo ""',
    'echo "=== SEARCHING FOR drsaleh dashboard in ALL nginx configs ==="',
    'grep -r "drsalehalkhalaf.com" /etc/nginx/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING APACHE SITES ENABLED ==="',
    'ls -la /etc/apache2/sites-enabled/ 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING CPANEL USER CONFIGS ==="',
    'ls -la /etc/apache2/conf.d/userdata/std/2_4/milaknight/ 2>/dev/null',
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
