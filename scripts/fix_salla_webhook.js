const { Client } = require('ssh2');
const conn = new Client();

const ENV_PATH = '/root/milaknight-os/.env';
const WEBHOOK_SECRET = '734d5f1d77cc31bb66df53293fc7b2107ca81c47c23f5dfda134951309daf980';

const setCmd = `grep -q '^SALLA_WEBHOOK_SECRET=' ${ENV_PATH} && sed -i 's|^SALLA_WEBHOOK_SECRET=.*|SALLA_WEBHOOK_SECRET=${WEBHOOK_SECRET}|' ${ENV_PATH} || echo 'SALLA_WEBHOOK_SECRET=${WEBHOOK_SECRET}' >> ${ENV_PATH}`;

const deployCmd = [
    setCmd,
    'cd /root/milaknight-os',
    'git fetch origin',
    'git reset --hard origin/main',
    'npm ci --production=false',
    'npm run build',
    'pm2 restart milaknight',
    'pm2 status'
].join(' && ');

conn.on('ready', () => {
    console.log('Connected. Deploying Salla webhook fix...');
    conn.exec(deployCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { console.log('\nDone.'); conn.end(); });
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
