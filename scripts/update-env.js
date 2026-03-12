const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    const command = 'echo "GMAIL_EMAIL=mrefaie@milaknights.com" >> milaknight-os/.env && echo "GMAIL_APP_PASSWORD=miwobspticjjoooo" >> milaknight-os/.env && echo "FACEBOOK_CLIENT_ID=105519837670318" >> milaknight-os/.env && echo "FACEBOOK_CLIENT_SECRET=3e5a57fdb62a70908809355e0f8e5cb5" >> milaknight-os/.env && pm2 restart all';
    conn.exec(command, (err, stream) => {
        if (err) {
            console.error('Error executing command:', err);
            conn.end();
            return;
        }
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
