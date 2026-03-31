const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server. Checking PM2 status and logs...');
    // Check if process is online, and grab the last 50 lines of logs to see what crashed
    conn.exec('pm2 status && pm2 logs milaknight --lines 50 --nostream', (err, stream) => {
        if (err) {
            console.error('Remote execution error:', err);
            conn.end();
            return;
        }
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
        stream.on('close', () => {
            console.log('\n--- Disconnected ---');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('SSH Connection error:', err);
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
