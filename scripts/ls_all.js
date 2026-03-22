const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const folders = [
    '/home/milaknight/dashboard.aalsaigh.com',
    '/home/milaknight/dashboard.aburahmah.com',
    '/home/milaknight/dashboard.drsalehalkhalaf.com',
    '/home/milaknight/dashboard.mila-knight.com',
    '/home/milaknight/dashboard.tba.sa',
    '/home/milaknight/back.almunifi.com',
    '/home/milaknight/back.tba.sa',
    '/home/milaknight/backend.aburahmah.com'
  ];

  const cmd = folders.map(f => `echo "--- ${f} ---" && ls -F ${f}`).join(' && ');

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
