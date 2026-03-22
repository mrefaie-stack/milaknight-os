const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Curl one of the broken dashboards to see if it works now
    const cmds = [
        'curl -s -o /dev/null -w "%{http_code}" https://dashboard.aalsaigh.com/',
        'curl -s -o /dev/null -w "%{http_code}" https://dashboard.mila-knight.com/'
    ];
    
    conn.exec(cmds.join(' && echo " " && '), (err, stream) => {
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
