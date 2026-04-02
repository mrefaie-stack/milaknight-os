const { Client } = require('ssh2');
const fs = require('fs');

fs.writeFileSync('deploy_status.txt', '1. Connecting to Server...\n');
console.log("Connecting...");

const client = new Client();
client.on('ready', () => {
    fs.appendFileSync('deploy_status.txt', '2. Connected! Rebuilding and Restarting PM2...\n');
    console.log("Connected, running build...");
    
    // We already ran emergency_restore.js which pushed the files. So let's just trigger the PM2 reboot to be absolutely sure.
    client.exec('cd /root/milaknight-os && npm run build && pm2 restart milaknight', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => {
             console.log(d.toString());
             fs.appendFileSync('deploy_status.txt', d.toString());
        });
        stream.stderr.on('data', d => {
             console.error(d.toString());
             fs.appendFileSync('deploy_status.txt', d.toString());
        });
        stream.on('close', () => {
             fs.appendFileSync('deploy_status.txt', '\n\n=== 3. SERVER FULLY RESTARTED! ===\n');
             console.log("Server Restarted!");
             client.end();
        });
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
