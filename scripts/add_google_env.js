const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const vars = [
        `GOOGLE_CLIENT_ID=238469256706-802dd4kv695npcjten49aksmco7usvbq.apps.googleusercontent.com`,
        `GOOGLE_CLIENT_SECRET=GOCSPX-***`
    ];

    const checkAndAdd = vars.map(v => {
        const key = v.split('=')[0];
        return `grep -q '^${key}=' /root/milaknight-os/.env || echo '${v}' >> /root/milaknight-os/.env`;
    }).join(' && ');

    const cmd = `${checkAndAdd} && echo "--- Current Google vars ---" && grep 'GOOGLE' /root/milaknight-os/.env`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\nDone. Restarting PM2...');
            conn.exec('pm2 restart milaknight && pm2 status', (err2, s2) => {
                if (err2) { console.error(err2); conn.end(); return; }
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.stderr.on('data', d => process.stderr.write(d.toString()));
                s2.on('close', () => conn.end());
            });
        });
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
