const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sites = [
    // Dashboards
    ['dashboard.aalsaigh.com', 'https'],
    ['dashboard.tba.sa', 'https'],
    ['dashboard.aburahmah.com', 'https'],
    ['dashboard.drsalehalkhalaf.com', 'https'],
    ['dashboard.mila-knight.com', 'https'],
    // Main sites
    ['aalsaigh.com', 'https'],
    ['tba.sa', 'https'],
    ['aburahmah.com', 'https'],
    ['drsalehalkhalaf.com', 'https'],
    ['mila-knight.com', 'https'],
    ['almunifi.com', 'https'],
    // Backends (API)
    ['backend.aalsaigh.com', 'https'],
    ['backend.aburahmah.com', 'https'],
    ['backend.almunifi.com', 'https'],
    ['back.tba.sa', 'https'],
    // OS
    ['os.mila-knight.com', 'https'],
    ['portainer.mila-knight.com', 'https'],
  ];

  const curlCmds = sites.map(([domain, proto]) => 
    `curl -sk -o /dev/null -w "${domain}: %{http_code}\\n" ${proto}://${domain}/ 2>/dev/null`
  );

  const cmd = [
    'echo "=== FULL SITE STATUS CHECK ==="',
    ...curlCmds,
    'echo ""',
    'echo "=== NGINX STATUS ==="',
    'systemctl is-active nginx',
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
