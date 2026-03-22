const { Client } = require('ssh2');

const sshConn = new Client();
sshConn.on('ready', () => {
    // Get recent PM2 logs filtered for auto-report IG data
    sshConn.exec(
        'pm2 logs milaknight --nostream --lines 200 2>&1 | grep -E "(follows_and_unfollows|website_clicks|IG metrics|IG total_value|instagram result|auto-report)" | tail -60',
        (err, stream) => {
            if (err) { console.error(err); sshConn.end(); return; }
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => sshConn.end());
        }
    );
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
