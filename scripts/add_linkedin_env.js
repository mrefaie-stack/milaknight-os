const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        grep -q "LINKEDIN_CLIENT_ID" /root/milaknight-os/.env || echo '
LINKEDIN_CLIENT_ID=7763dq2w0ajqiz
LINKEDIN_CLIENT_SECRET=WPL_AP1.7jF8KqBhyZp8d2e6.XPkB2g==' >> /root/milaknight-os/.env
        grep LINKEDIN /root/milaknight-os/.env
    `, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
