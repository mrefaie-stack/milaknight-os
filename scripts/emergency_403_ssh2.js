const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server.');
    
    const cmds = [
        'echo "--- NGINX STATUS ---"',
        'systemctl is-active nginx',
        'echo "\\n--- LAST 20 NGINX ERRORS ---"',
        'tail -n 20 /var/log/nginx/error.log',
        'echo "\\n--- /home PERMISSIONS ---"',
        'ls -la /home/',
        'echo "\\n--- /home/milaknight PERMISSIONS ---"',
        'ls -la /home/milaknight/ | head -n 10',
        'echo "\\n--- NGINX USER ---"',
        'ps aux | grep nginx'
    ];

    conn.exec(cmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', d => process.stdout.write(d))
              .stderr.on('data', d => process.stderr.write(d));
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
