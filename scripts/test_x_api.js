const { Client } = require('ssh2');
const conn = new Client();
const script = `
const bearerToken = process.env.X_BEARER_TOKEN;
const userId = process.env.X_USER_ID;
const base = 'https://api.twitter.com/2';
const h = { Authorization: 'Bearer ' + bearerToken };

const get = async (label, url) => {
    const r = await fetch(url, { headers: h });
    const b = await r.json().catch(() => ({}));
    console.log('\\n=== ' + label + ' === Status:' + r.status);
    console.log(JSON.stringify(b, null, 2).substring(0, 2000));
};

console.log('userId:', userId);
console.log('bearerToken starts:', bearerToken?.substring(0, 30));

// User by ID
await get('User by ID', base + '/users/' + userId + '?user.fields=public_metrics,description,name,username,created_at,profile_image_url');

// User by username
await get('User by username', base + '/users/by/username/milaknightmk?user.fields=public_metrics,name,username');

// Recent tweets
await get('Recent Tweets', base + '/users/' + userId + '/tweets?max_results=5&tweet.fields=public_metrics,created_at,text');

// User mentions
await get('Mentions', base + '/users/' + userId + '/mentions?max_results=5&tweet.fields=public_metrics');
`;
conn.on('ready', () => {
    conn.exec(`cd /root/milaknight-os && node --input-type=module <<'JSEOF'\n${script}\nJSEOF`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
