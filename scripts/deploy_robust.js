const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    const commands = [
        'cd milaknight-os',
        'git fetch origin',
        'git reset --hard origin/main',
        'npm install',
        'npx prisma db push',
        'npm run build',
        'pm2 delete milaknight || true',
        'pm2 start npm --name "milaknight" -- start -- -p 3333',
        'pm2 save'
    ].join(' && ');

    conn.exec(commands, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
            process.exit(0);
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
