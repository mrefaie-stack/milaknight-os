const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec('pm2 logs milaknight --lines 50 --no-daemon', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
            process.exit(0);
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
        
        // Timeout after 10 seconds of logs
        setTimeout(() => {
            conn.end();
            process.exit(0);
        }, 10000);
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
