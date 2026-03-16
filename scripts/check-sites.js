const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== Port check ===" && ss -tlnp | grep -E \':80 |:443 \'',
    'echo ""',
    'echo "=== nginx status ===" && systemctl is-active nginx',
    'echo ""',
    'echo "=== Testing domains ==="',
    'for d in aalsaigh.com aburahmah.com almunifi.com tba.sa drsalehalkhalaf.com evoque.mila-knight.com aroma.mila-knight.com aromav2.mila-knight.com mila-knight.com os.mila-knight.com backend.mila-knight.com portainer.mila-knight.com tbabackend.mila-knight.com; do',
    '  code=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 5 "https://${d}/" 2>/dev/null)',
    '  echo "  ${d}: ${code}"',
    'done',
  ].join('\n');

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\nExit code:', code);
      conn.end();
    }).on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2', readyTimeout: 30000 });
