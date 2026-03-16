const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('=== Getting LE certs for all domains and updating nginx ===\n');

  // All domains that need proper LE certs
  const domains = [
    'mila-knight.com www.mila-knight.com',
    'aalsaigh.com www.aalsaigh.com',
    'aburahmah.com www.aburahmah.com',
    'almunifi.com www.almunifi.com',
    'tba.sa www.tba.sa',
    'drsalehalkhalaf.com www.drsalehalkhalaf.com',
    'evoque.mila-knight.com',
    'aroma.mila-knight.com www.aroma.mila-knight.com',
    'aromav2.mila-knight.com',
    'portainer.mila-knight.com',
    'tbabackend.mila-knight.com',
    'backend.aalsaigh.com',
    'backend.almunifi.com',
    'backend.drsalehalkhalaf.com',
    'dashboard.mila-knight.com',
    'dashboard.aalsaigh.com',
    'dashboard.aburahmah.com',
    'dashboard.tba.sa',
  ];

  const certCommands = domains.map(d => {
    const firstDomain = d.split(' ')[0];
    const dFlags = d.split(' ').map(x => '-d ' + x).join(' ');
    return `echo "--- ${firstDomain} ---" && certbot certonly --nginx --non-interactive --agree-tos --email admin@mila-knight.com ${dFlags} 2>&1 | tail -5`;
  }).join('\n');

  // After getting certs, update nginx configs to use LE certs where available
  const updateCmd = `
# Update nginx configs to use LE certs
update_le_cert() {
  local domain="$1"
  local conf="/etc/nginx/conf.d/${domain}.conf"
  local le_cert="/etc/letsencrypt/live/${domain}/fullchain.pem"
  local le_key="/etc/letsencrypt/live/${domain}/privkey.pem"

  if [ -f "$le_cert" ] && [ -f "$conf" ]; then
    # Replace the ssl_certificate lines
    sed -i "s|ssl_certificate .*|ssl_certificate ${le_cert};|g" "$conf"
    sed -i "s|ssl_certificate_key .*|ssl_certificate_key ${le_key};|g" "$conf"
    echo "Updated ${domain} to use LE cert"
  fi
}

# Update all domains with LE certs
for d in backend.mila-knight.com mila-knight.com aalsaigh.com aburahmah.com almunifi.com tba.sa drsalehalkhalaf.com evoque.mila-knight.com aroma.mila-knight.com aromav2.mila-knight.com portainer.mila-knight.com tbabackend.mila-knight.com backend.aalsaigh.com backend.almunifi.com backend.drsalehalkhalaf.com dashboard.mila-knight.com dashboard.aalsaigh.com dashboard.aburahmah.com dashboard.tba.sa; do
  update_le_cert "$d"
done

echo ""
echo "=== Testing nginx ==="
nginx -t 2>&1 && nginx -s reload && echo "nginx reloaded"
`;

  const fullCmd = certCommands + '\n\n' + updateCmd;

  conn.exec(fullCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\n=== Done, exit code:', code, '===');
      conn.end();
    }).on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2', readyTimeout: 30000 });
