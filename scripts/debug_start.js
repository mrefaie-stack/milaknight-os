const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    // Stop pm2 first to free the port, then try next start manually
    conn.exec('cd milaknight-os && npx next start -p 3333', (err, stream) => {
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
        
        setTimeout(() => {
            conn.end();
            process.exit(0);
        }, 15000);
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
