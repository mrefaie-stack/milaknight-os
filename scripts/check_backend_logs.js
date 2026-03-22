const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Check more logs from elsaigh to see the full trace
    const cmds = [
        'docker logs --tail 20 backend_elsaigh-app-1',
        'docker logs --tail 20 backend_mila_knight-app-1'
    ];
    
    conn.exec(cmds.join(' && echo "\n--- NEXT ---\n" && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
