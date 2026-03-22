const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmd = `cd /root/milaknight-os && git fetch origin && git reset --hard origin/main && npm ci --production=false && npm run build && pm2 restart milaknight && pm2 status 2>&1`;
    console.log('Starting deployment...');
    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log('\nDeploy exit code:', code);
            conn.end();
        });
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
