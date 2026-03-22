const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== USERS IN ELSAIGH DB ==="',
    'docker exec backend_elsaigh-app-1 bundle exec rails runner "puts User.all.map{|u| [u.email, u.encrypted_password]}"',
    'echo ""',
    'echo "=== USERS IN MILA KNIGHT DB ==="',
    'docker exec backend_mila_knight-app-1 bundle exec rails runner "puts User.all.map{|u| [u.email, u.encrypted_password]}"',
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
