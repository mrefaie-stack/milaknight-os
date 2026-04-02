const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 logs milaknight --lines 150 --nostream', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        stream.stderr.on('data', d => output += d);
        stream.on('close', () => {
            fs.writeFileSync('server_pm2_logs.txt', output);
            conn.end();
            console.log("LOGS SAVED");
        });
    });
}).on('error', (err) => {
    fs.writeFileSync('server_pm2_logs.txt', "CONNECTION ERROR: " + err);
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
