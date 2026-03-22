const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.eEYJv5Oqy3S8jwpWd1nMIQYN30rbz3F5AH5QmDR4Qik';
  const cmd = `curl -i -k -X GET https://backend.aalsaigh.com/auth/user/1 -H "Authorization: Bearer ${token}"`;

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
