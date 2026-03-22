const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== REVERTING backend.aburahmah.com ==="',
    'cp /etc/nginx/conf.d/backend.aburahmah.com.conf.bak /etc/nginx/conf.d/backend.aburahmah.com.conf',
    'echo "Reverted config. Checking contents:"',
    'cat /etc/nginx/conf.d/backend.aburahmah.com.conf',
    'echo ""',
    'echo "=== CHECKING dashboard.mila-knight.com FOR PREVIOUS STATE ==="',
    '# Let search logs or history? No easy way. Let check if it has a .bak or similar.',
    'ls -la /etc/nginx/conf.d/dashboard.mila-knight.com.conf*',
    'echo ""',
    'echo "=== NGINX TEST & RELOAD ==="',
    'nginx -t && systemctl reload nginx',
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
