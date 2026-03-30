const { Client } = require('ssh2');
const conn = new Client();
const script = `
require('dotenv').config();
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
    console.log('token prefix:', bearerToken ? bearerToken.substring(0, 20) + '...' : 'MISSING');

    await get('User by ID', base + '/users/' + userId + '?user.fields=public_metrics,description,name,username');
    await get('User by username milaknight', base + '/users/by/username/milaknight?user.fields=public_metrics,name,username');
    await get('Recent Tweets', base + '/users/' + userId + '/tweets?max_results=5&tweet.fields=public_metrics,created_at');
}
main().catch(e => console.error('ERROR:', e));
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/x_test.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/x_test.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
