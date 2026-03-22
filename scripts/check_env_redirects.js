const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING FOR .env FILES IN ALL DASHBOARDS ==="',
    'find /home/milaknight/dashboard.* -name ".env*" 2>/dev/null',
    'echo ""',
    'echo "=== READING .env IF EXISTS (MILA KNIGHT) ==="',
    'cat /home/milaknight/dashboard.mila-knight.com/.env 2>/dev/null',
    'echo ""',
    'echo "=== SEARCHING FOR VITE_ OR REACT_APP_ IN JS ==="',
    'grep -raE "(VITE_|REACT_APP_)" /home/milaknight/dashboard.mila-knight.com/assets/ | head -n 5',
    'echo ""',
    'echo "=== CHECKING FOR REDIRECTS IN _redirects ==="',
    'cat /home/milaknight/dashboard.mila-knight.com/_redirects 2>/dev/null',
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
