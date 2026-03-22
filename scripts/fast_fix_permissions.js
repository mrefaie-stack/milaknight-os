const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server. Running fast permissions fix...');
    
    // Command to recursively give read/execute to group and others
    // This instantly fixes the 403 Forbidden
    const targetDirs = [
        '/home/milaknight/dashboard.*',
        '/home/milaknight/aroma*',
        '/home/milaknight/*aalsaigh*',
        '/home/milaknight/*aburahmah*',
        '/home/milaknight/*almunifi*'
    ].join(' ');

    const cmds = [
        // Ensure the home folder is accessible
        'chmod 755 /home/milaknight',
        // Make sure Nginx can enter the subdirectories and read files inside them without making all files blindly executable
        // Using X (uppercase) adds execute only to directories, not files (unless already executable by owner)
        `find ${targetDirs} -type d -exec chmod 755 {} + 2>/dev/null`,
        `find ${targetDirs} -type f -exec chmod 644 {} + 2>/dev/null`,
        'echo "\\n--- DONE ---"',
        'ls -la /home/milaknight/ | grep -E "dashboard|aroma|aalsaigh|aburahmah|almunifi" | head -n 10'
    ];
    
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
