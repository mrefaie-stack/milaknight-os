const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Check logs for Errno::EACCES or Permission denied in multiple containers
    const cmds = [
        'docker logs --tail 50 backend_drsaleeh-app-1 2>&1 | grep -i "permission\\|eacces\\|error" || echo "No permissions error here"',
        'docker logs --tail 50 tba_backend-app-1 2>&1 | grep -i "permission\\|eacces\\|error" || echo "No permissions error here"',
        'docker exec backend_elsaigh-app-1 ls -la tmp/ log/ storage/ 2>/dev/null | head -n 15'
    ];
    
    conn.exec(cmds.join(' && echo "\n--------\n" && '), (err, stream) => {
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
