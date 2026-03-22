const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== TESTING LOGIN WITH NEW PASSWORD ==="',
    '# Try a dummy login with reset password',
    'curl -i -k -X POST -H "Content-Type: application/json" -d \'{"email":"abdelrahmank@milaknights.com","password":"password123"}\' https://backend.aalsaigh.com/auth/login',
    'echo ""',
    'echo "=== TESTING LOGIN WITH NESTED PARAMETERS ==="',
    'curl -i -k -X POST -H "Content-Type: application/json" -d \'{"authentication":{"email":"abdelrahmank@milaknights.com","password":"password123"}}\' https://backend.aalsaigh.com/auth/login',
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
