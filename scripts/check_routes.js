const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmds = [
        'docker exec backend_elsaigh-app-1 bundle exec rails routes | grep -i "operation"'
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
