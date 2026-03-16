const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `nginx -t 2>&1 && echo "---" && journalctl -u nginx --no-pager -n 30 2>&1`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Exit code:', code);
      conn.end();
    }).on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
