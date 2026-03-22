const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CONTENTS OF /home/drsalehalkhalaf/dashboard.drsalehalkhalaf.com ==="',
    'ls -la /home/drsalehalkhalaf/dashboard.drsalehalkhalaf.com',
    'echo ""',
    'echo "=== CHECKING index.html IN CORRECT SALEH FOLDER ==="',
    'grep -iE "title|logo" /home/drsalehalkhalaf/dashboard.drsalehalkhalaf.com/index.html 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING PERMISSIONS OF THE FOLDER ==="',
    'ls -ld /home/drsalehalkhalaf/dashboard.drsalehalkhalaf.com',
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
