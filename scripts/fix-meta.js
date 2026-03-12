const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    // More robust clean up and update
    const command = `
        cd milaknight-os && 
        sed -i '/FACEBOOK_CLIENT_ID/d' .env && 
        sed -i '/FACEBOOK_CLIENT_SECRET/d' .env && 
        echo "FACEBOOK_CLIENT_ID=1055199837670318" >> .env && 
        echo "FACEBOOK_CLIENT_SECRET=3e5a57fdb62a70908809355e0f8e5cb5" >> .env && 
        pm2 restart milaknight --update-env
    `;
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
            console.error('STDERR: ' + data);
        });
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
