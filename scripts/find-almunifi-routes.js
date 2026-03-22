const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  // Get the list of available routes from the Rails app
  const cmd = [
    'echo "=== Rails routes for almunifi dashboard ==="',
    'docker exec dr_almunifi_dashboard-app-1 bundle exec rails routes 2>/dev/null | head -50',
    'echo ""',
    'echo "=== Try common paths ==="',
    'curl -sk -o /dev/null -w "/signin: %{http_code}\n" http://127.0.0.1:9002/signin',
    'curl -sk -o /dev/null -w "/login: %{http_code}\n" http://127.0.0.1:9002/login',
    'curl -sk -o /dev/null -w "/users/sign_in: %{http_code}\n" http://127.0.0.1:9002/users/sign_in',
    'curl -sk -o /dev/null -w "/dashboard: %{http_code}\n" http://127.0.0.1:9002/dashboard',
    'curl -sk -o /dev/null -w "/admin: %{http_code}\n" http://127.0.0.1:9002/admin',
    'curl -sk -o /dev/null -w "/operations_landing: %{http_code}\n" http://127.0.0.1:9002/operations_landing',
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
