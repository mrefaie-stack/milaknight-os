const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server. Fixing permissions...');
    
    // Commands to reset permissions for HTTP access
    // We set folders to 755 and files to 644 for all relevant dashboards.
    const cmds = [
        'chmod 755 /home/milaknight',
        'find /home/milaknight -maxdepth 1 -name "dashboard.*" -exec chmod 755 {} \\;',
        'find /home/milaknight -maxdepth 1 -name "aroma*" -exec chmod 755 {} \\;',
        'find /home/milaknight -maxdepth 1 -name "*aalsaigh*" -exec chmod 755 {} \\;',
        'find /home/milaknight -maxdepth 1 -name "*aburahmah*" -exec chmod 755 {} \\;',
        'find /home/milaknight -maxdepth 1 -name "*almunifi*" -exec chmod 755 {} \\;'
    ];

    // For recursive files/folders inside the dashboards to ensure readability
    const targets = [
        '/home/milaknight/dashboard.*',
        '/home/milaknight/aroma*',
        '/home/milaknight/*aalsaigh*',
        '/home/milaknight/*aburahmah*',
        '/home/milaknight/*almunifi*'
    ];
    
    cmds.push(`find ${targets.join(' ')} -type d -exec chmod 755 {} \\; 2>/dev/null`);
    cmds.push(`find ${targets.join(' ')} -type f -exec chmod 644 {} \\; 2>/dev/null`);
    
    cmds.push('echo "\\n--- NEW PERMISSIONS ---"');
    cmds.push('ls -la /home/milaknight/ | grep "dashboard\\|aroma\\|aalsaigh\\|aburahmah\\|almunifi"');
    
    conn.exec(cmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('\nFinished resolving permissions.');
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
