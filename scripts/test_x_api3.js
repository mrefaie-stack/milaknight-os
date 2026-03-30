const { Client } = require('ssh2');
const conn = new Client();
const script = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
// Load env manually
const fs = require('fs');
const env = fs.readFileSync('/root/milaknight-os/.env', 'utf8');
for (const line of env.split('\\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
}

const bearerToken = process.env.X_BEARER_TOKEN;
const userId = process.env.X_USER_ID;
const base = 'https://api.twitter.com/2';
const h = { 'Authorization': 'Bearer ' + bearerToken };

async function get(label, url) {
    const r = await fetch(url, { headers: h });
    const b = await r.json().catch(() => ({}));
    console.log('\\n=== ' + label + ' === Status:' + r.status);
    console.log(JSON.stringify(b, null, 2).substring(0, 2000));
}

async function main() {
    console.log('userId:', userId);
    console.log('token:', bearerToken ? bearerToken.substring(0, 30) + '...' : 'MISSING');

    await get('User by ID', base + '/users/' + userId + '?user.fields=public_metrics,description,name,username,profile_image_url');
    await get('Recent Tweets', base + '/users/' + userId + '/tweets?max_results=10&tweet.fields=public_metrics,created_at,text');
    await get('User Liked Tweets count', base + '/users/' + userId + '/liked_tweets?max_results=5');
}
main().catch(e => console.error('ERROR:', e));
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/x_test3.js');
        s.on('close', () => {
            conn.exec('node /tmp/x_test3.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
