const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Checking logs specifically for the Aalsaigh backend which the screenshot shows is failing
    const cmds = [
        'echo "--- AALSAIGH BACKEND LOGS ---"',
        'docker logs --tail 100 backend_elsaigh-app-1 2>&1 | grep -i -A 15 "Started GET \\"/operation/3\\"" || docker logs --tail 20 backend_elsaigh-app-1',
        'echo "--- GENERAL ERRORS IN AALSAIGH ---"',
        'docker logs --tail 100 backend_elsaigh-app-1 2>&1 | grep -i "error\\|exception\\|fatal" | tail -n 20'
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
