const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmds = [
        'echo "--- operations_controller.rb content (lines 50-80) ---"',
        'docker exec backend_elsaigh-app-1 sed -n "50,80p" app/controllers/operations_controller.rb',
        'echo "\\n--- content_photo model ---"',
        'docker exec backend_elsaigh-app-1 cat app/models/content_photo.rb'
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
