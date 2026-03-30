const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Connected...');
    const addEnvVars = `
grep -q "TIKTOK_APP_KEY" /root/milaknight-os/.env || echo '
TIKTOK_APP_KEY="6jfqcq9ppqugf"
TIKTOK_APP_SECRET="7ecf1a04a1155ed36652e5408d2de13b0e148b6a"' >> /root/milaknight-os/.env
cat /root/milaknight-os/.env | grep TIKTOK
`;
    conn.exec(addEnvVars, (err, s1) => {
        if (err) throw err;
        s1.on('data', d => process.stdout.write(d.toString()));
        s1.stderr.on('data', d => process.stderr.write(d.toString()));
        s1.on('close', () => {
            conn.exec(
                'cd /root/milaknight-os && git fetch origin && git reset --hard origin/main && npm ci --production=false && npx prisma generate && npm run build && pm2 restart milaknight && pm2 status',
                (err2, s2) => {
                    if (err2) throw err2;
                    s2.on('data', d => process.stdout.write(d.toString()));
                    s2.stderr.on('data', d => process.stderr.write(d.toString()));
                    s2.on('close', code => { console.log('Done, exit:', code); conn.end(); });
                }
            );
        });
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
