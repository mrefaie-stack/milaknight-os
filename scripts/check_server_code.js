const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cd /root/milaknight-os && git log --oneline -5 && echo "---" && grep -n "period" src/lib/meta-api.ts 2>&1`, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
