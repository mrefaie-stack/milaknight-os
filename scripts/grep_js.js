const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== SEARCHING FOR API ENDPOINTS IN JS ==="',
    'grep -ra "http" /home/milaknight/dashboard.mila-knight.com/assets/ | grep -v "w3.org" | head -n 10',
    'echo ""',
    'echo "=== SEARCHING FOR login IN JS ==="',
    'grep -ra "login" /home/milaknight/dashboard.mila-knight.com/assets/ | head -n 10',
    'echo ""',
    'echo "=== SEARCHING FOR backend IN JS ==="',
    'grep -ra "backend" /home/milaknight/dashboard.mila-knight.com/assets/ | head -n 10',
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
