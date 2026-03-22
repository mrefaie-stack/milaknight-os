const { Client } = require('ssh2');

const DEPLOY_CMD = 'cd /root/milaknight-os && git fetch origin && git reset --hard origin/main && npm ci --production=false && npm run build && pm2 restart milaknight && echo "DONE" && pm2 status 2>&1 | grep milaknight';

const sshConn = new Client();
sshConn.on('ready', () => {
    console.log('Deploying...');
    sshConn.exec(DEPLOY_CMD, { pty: false }, (err, stream) => {
        if (err) { console.error(err); sshConn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => sshConn.end());
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
