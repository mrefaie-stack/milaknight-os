const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== SEARCHING FOR index.php FILES ==="',
    'find /home/milaknight -name "index.php" -maxdepth 3 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING back.tba.sa CONTENTS ==="',
    'ls -la /home/milaknight/back.tba.sa/',
    'echo ""',
    'echo "=== CHECKING back.almunifi.com CONTENTS ==="',
    'ls -la /home/milaknight/back.almunifi.com/',
    'echo ""',
    'echo "=== TESTING LOGIN POST WITH HEADERS (DASHBOARD) ==="',
    '# Use a single line to avoid bash unexpected EOF',
    'curl -i -k -X POST https://backend.aalsaigh.com/auth/login -H "Content-Type: application/json" -d \'{"email":"test","password":"test"}\' 2>&1 | head -n 20',
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
