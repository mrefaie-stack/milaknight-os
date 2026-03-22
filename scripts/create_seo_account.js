const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const containers = [
    'backend_elsaigh-app-1',
    'backend_mila_knight-app-1',
    'tba_backend-app-1',
    'dr_almunifi_dashboard-app-1',
    'backend_drsaleeh-app-1',
    'backend_aburahmah-app-1'
  ];

  const railsCmd = "User.find_or_initialize_by(email: 'seo@milaknights.com').tap { |u| u.name = 'SEO'; u.password = 'seo123'; u.password_confirmation = 'seo123' }.save!";

  const cmd = containers.map(c => 
    `echo "--- ACCOUNT IN ${c} ---" && docker exec ${c} bundle exec rails runner "${railsCmd}" && echo "Success" || echo "Failed"`
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
