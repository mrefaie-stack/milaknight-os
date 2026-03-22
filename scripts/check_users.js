const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const containers = [
    'backend_elsaigh-app-1',
    'backend_mila_knight-app-1'
  ];

  const cmd = containers.map(c => 
    `echo "--- USERS IN ${c} ---" && docker exec ${c} bundle exec rails runner "puts User.count; puts User.first.email rescue 'No User'" || echo "Exec failed"`
  ).join(' && ');

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
