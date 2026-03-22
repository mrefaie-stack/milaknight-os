const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Generate an intentional error log or check recent ones
    const cmds = [
        'echo "--- RECENT LOGS AFTER RESTART ---"',
        'docker logs --tail 30 backend_elsaigh-app-1',
        'docker logs --tail 30 backend_mila_knight-app-1'
    ];
    
    conn.exec(cmds.join(' && echo "\n---\n" && '), (err, stream) => {
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
