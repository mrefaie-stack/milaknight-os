const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== aburahmah.com (port 9106) last errors ==="',
    'docker logs dr-aburahma-web-1 --tail=20 2>&1 | tail -20',
    '',
    'echo ""',
    'echo "=== mila-knight.com (port 9103) last errors ==="',
    'docker logs milaknight-nextjs --tail=20 2>&1 | tail -20',
    '',
    // Check if these containers have env files they need
    'echo ""',
    'echo "=== aburahmah container env ==="',
    'docker inspect dr-aburahma-web-1 --format "{{range .Config.Env}}{{println .}}{{end}}" 2>/dev/null | grep -v "PASSWORD\\|SECRET\\|KEY" | head -15',
    '',
    'echo ""',
    'echo "=== milaknight-nextjs container env ==="',
    'docker inspect milaknight-nextjs --format "{{range .Config.Env}}{{println .}}{{end}}" 2>/dev/null | grep -v "PASSWORD\\|SECRET\\|KEY" | head -15',
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
