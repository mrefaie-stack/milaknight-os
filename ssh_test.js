const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 status milaknight && pm2 logs milaknight --lines 100 --nostream', (err, stream) => {
        let out = '';
        if (err) { fs.writeFileSync('live_status.txt', 'ERR: ' + err); return conn.end(); }
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
            fs.writeFileSync('live_status.txt', out);
            conn.end();
        });
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
