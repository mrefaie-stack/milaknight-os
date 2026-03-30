const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Replace GOOGLE_CLIENT_SECRET with the correct value (escape special chars for sed)
    const newSecret = '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';
    const cmd = [
        `sed -i 's|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET="${newSecret}"|' /root/milaknight-os/.env`,
        `echo "--- Updated ---"`,
        `grep 'GOOGLE' /root/milaknight-os/.env`,
        `pm2 restart milaknight`
    ].join(' && ');

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2'
});
