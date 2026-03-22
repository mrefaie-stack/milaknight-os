const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const containers = [
    'backend_elsaigh-app-1',
    'backend_elsaigh-db-1',
    'backend_elsaigh-redis-1',
    'backend_elsaigh-sidekiq-1',
    'backend_mila_knight-app-1',
    'backend_mila_knight-db-1',
    'backend_mila_knight-redis-1',
    'backend_mila_knight-sidekiq-1',
    'tba_backend-app-1',
    'tba_backend-db-1',
    'tba_backend-redis-1',
    'tba_backend-sidekiq-1',
    'dr_almunifi_dashboard-app-1',
    'dr_almunifi_dashboard-db-1',
    'dr_almunifi_dashboard-redis-1',
    'dr_almunifi_dashboard-sidekiq-1'
  ];

  const cmd = `docker restart ${containers.join(' ')}`;

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
