const { Client } = require('ssh2');
const fs = require('fs');

const files = [
    'src/app/api/seo/site-analysis/route.ts',
    'src/components/seo/site-analysis.tsx',
    'src/app/api/seo/analyze/route.ts'
];

fs.writeFileSync('deploy_status.txt', '1. Connecting to deploy new Market Intelligence features...\n');

const client = new Client();
client.on('ready', () => {
    fs.appendFileSync('deploy_status.txt', '2. Connected!\n');
    client.sftp((err, sftp) => {
        if (err) throw err;
        let uploaded = 0;
        
        const uploadNext = () => {
             if (uploaded >= files.length) {
                 fs.appendFileSync('deploy_status.txt', '3. Files uploaded successfully! Rebuilding server...\n');
                 client.exec('cd /root/milaknight-os && npm run build && pm2 restart milaknight', (err, stream) => {
                     stream.on('data', d => fs.appendFileSync('deploy_status.txt', d.toString()));
                     stream.stderr.on('data', d => fs.appendFileSync('deploy_status.txt', d.toString()));
                     stream.on('close', () => {
                         fs.appendFileSync('deploy_status.txt', '\n\n=== 4. SERVER DEPLOYMENT COMPLETE! ===\n');
                         client.end();
                     });
                 });
                 return;
             }
             const f = files[uploaded];
             sftp.fastPut(f, `/root/milaknight-os/${f}`, (err) => {
                 uploaded++;
                 uploadNext();
             });
        }
        
        uploadNext();
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
