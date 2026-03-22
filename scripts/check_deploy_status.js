const { Client } = require('ssh2');

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.exec(
        'cd /root/milaknight-os && git log --oneline -3 && echo "---" && pm2 status milaknight 2>&1 | grep -E "(milaknight|online|stopped)"',
        (err, stream) => {
            if (err) { console.error(err); sshConn.end(); return; }
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => sshConn.end());
        }
    );
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
