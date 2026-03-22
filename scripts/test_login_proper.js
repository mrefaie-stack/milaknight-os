const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  // Use a single curl command with double quotes escaped correctly for the shell
  const cmd = 'curl -i -k -X POST https://backend.aalsaigh.com/auth/login -H "Content-Type: application/json" -d "{\\\"email\\\":\\\"abdelrahmank@milaknights.com\\\",\\\"password\\\":\\\"password123\\\"}"';

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
