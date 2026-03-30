const { Client } = require('ssh2');
const conn = new Client();

const ENV_PATH = '/root/milaknight-os/.env';
const vars = [
    ['SALLA_CLIENT_ID', '1ba0fc75-b543-4d71-b239-79f4011ad377'],
    ['SALLA_CLIENT_SECRET', '2bdad8cf1c6a0198920780849396ebdf82ba1dc9d74f38f8b7677f4f07d17d36'],
];

const setCmd = vars.map(([k, v]) =>
    `grep -q '^${k}=' ${ENV_PATH} && sed -i 's|^${k}=.*|${k}=${v}|' ${ENV_PATH} || echo '${k}=${v}' >> ${ENV_PATH}`
).join(' && ');

const fullCmd = `${setCmd} && pm2 restart milaknight && pm2 status`;

conn.on('ready', () => {
    console.log('Connected. Setting Salla env vars and restarting...');
    conn.exec(fullCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { console.log('\nDone.'); conn.end(); });
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
