const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server...');

    // Step 1: Add Snapchat env vars to .env on server
    const addEnvVars = `
grep -q "SNAPCHAT_CLIENT_ID" /root/milaknight-os/.env || echo '
SNAPCHAT_CLIENT_ID="207e6a38-bbff-4248-b410-90988d33417d"
SNAPCHAT_CLIENT_SECRET="621ed85f11f38e31a0c5"' >> /root/milaknight-os/.env
echo "Env vars check done"
cat /root/milaknight-os/.env | grep SNAPCHAT
`;

    conn.exec(addEnvVars, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            // Step 2: Deploy
            conn.exec(
                'cd /root/milaknight-os && git fetch origin && git reset --hard origin/main && npm ci --production=false && npx prisma generate && npm run build && pm2 restart milaknight && pm2 status',
                (err2, stream2) => {
                    if (err2) throw err2;
                    stream2.on('close', (code) => {
                        console.log('Deploy done, exit code:', code);
                        conn.end();
                    })
                    .on('data', d => process.stdout.write(d.toString()))
                    .stderr.on('data', d => process.stderr.write(d.toString()));
                }
            );
        })
        .on('data', d => process.stdout.write(d.toString()))
        .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
