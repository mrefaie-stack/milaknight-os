const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Clearing Rails cache and restarting containers...');
    
    const containers = [
        'backend_elsaigh-app-1',
        'backend_mila_knight-app-1',
        'tba_backend-app-1',
        'dr_almunifi_dashboard-app-1',
        'backend_drsaleeh-app-1',
        'backend_aburahmah-app-1'
    ];
    
    // Clear tmp/cache which contains bootsnap and other caches that might have been corrupted by chmod
    const cmds = containers.map(c => 
        `docker exec ${c} rm -rf tmp/cache/* 2>/dev/null || true`
    );
    
    // Restart containers to reload the fresh cache
    cmds.push(`docker restart ${containers.join(' ')}`);
    
    conn.exec(cmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Done clearing cache and restarting.');
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
