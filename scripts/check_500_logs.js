const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server. Checking backend container logs...');
    
    // Commands to check the logs of the backend containers to see why they are returning 500
    // We'll check the logs for the last 50 lines that might indicate a crash, database error, or permission issue inside the container
    const cmds = [
        'echo "\\n--- backend_elsaigh-app-1 LOGS ---"',
        'docker logs --tail 50 backend_elsaigh-app-1 2>&1 | grep -i "error\\|exception\\|fatal\\|500"',
        'echo "\\n--- backend_mila_knight-app-1 LOGS ---"',
        'docker logs --tail 50 backend_mila_knight-app-1 2>&1 | grep -i "error\\|exception\\|fatal\\|500"',
        'echo "\\n--- tba_backend-app-1 LOGS ---"',
        'docker logs --tail 50 tba_backend-app-1 2>&1 | grep -i "error\\|exception\\|fatal\\|500"',
        'echo "\\n--- dr_almunifi_dashboard-app-1 LOGS ---"',
        'docker logs --tail 50 dr_almunifi_dashboard-app-1 2>&1 | grep -i "error\\|exception\\|fatal\\|500"',
        'echo "\\n--- backend_drsaleeh-app-1 LOGS ---"',
        'docker logs --tail 50 backend_drsaleeh-app-1 2>&1 | grep -i "error\\|exception\\|fatal\\|500"',
        'echo "\\n--- backend_aburahmah-app-1 LOGS ---"',
        'docker logs --tail 50 backend_aburahmah-app-1 2>&1 | grep -i "error\\|exception\\|fatal\\|500"'
    ];
    
    conn.exec(cmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('\nFinished log inspection.');
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
