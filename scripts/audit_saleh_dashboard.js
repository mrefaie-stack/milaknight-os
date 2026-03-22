const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== DR SALEH INDEX.HTML CONTENT ==="',
    'grep -iE "title|logo" /home/milaknight/dashboard.drsalehalkhalaf.com/index.html 2>/dev/null',
    'echo ""',
    'echo "=== TBA INDEX.HTML CONTENT (FOR COMPARISON) ==="',
    'grep -iE "title|logo" /home/milaknight/dashboard.tba.sa/index.html 2>/dev/null',
    'echo ""',
    'echo "=== CHECKING FOR SALEH-SPECIFIC FOLDERS ==="',
    'ls -R /home/milaknight | grep -i saleh | grep -v "conf.d"',
    'echo ""',
    'echo "=== CHECKING FOR BACKUPS IN /root OR /home/milaknight ==="',
    'ls -d /home/milaknight/*.bak 2>/dev/null',
    'ls -d /home/milaknight/*backup* 2>/dev/null',
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
