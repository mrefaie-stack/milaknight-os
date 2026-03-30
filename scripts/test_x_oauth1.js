const { Client } = require('ssh2');
const conn = new Client();
const script = `
const fs = require('fs');
const crypto = require('crypto');
const env = fs.readFileSync('/root/milaknight-os/.env', 'utf8');
for (const line of env.split('\\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) process.env[line.substring(0,idx).trim()] = line.substring(idx+1).trim();
}

const consumerKey = process.env.X_API_KEY;
const consumerSecret = process.env.X_API_SECRET;
const accessToken = process.env.X_ACCESS_TOKEN;
const accessTokenSecret = process.env.X_ACCESS_SECRET;
const userId = process.env.X_USER_ID;

function oauthSign(method, url, params, consumerSecret, tokenSecret) {
    const sortedParams = Object.keys(params).sort().map(k =>
        encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
    ).join('&');
    const base = method.toUpperCase() + '&' + encodeURIComponent(url) + '&' + encodeURIComponent(sortedParams);
    const key = encodeURIComponent(consumerSecret) + '&' + encodeURIComponent(tokenSecret);
    return crypto.createHmac('sha1', key).update(base).digest('base64');
}

function oauthHeader(method, url, extraParams = {}) {
    const oauthParams = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: accessToken,
        oauth_version: '1.0',
        ...extraParams
    };
    const sig = oauthSign(method, url, oauthParams, consumerSecret, accessTokenSecret);
    oauthParams.oauth_signature = sig;
    const headerVal = 'OAuth ' + Object.keys(oauthParams).sort().map(k =>
        encodeURIComponent(k) + '="' + encodeURIComponent(oauthParams[k]) + '"'
    ).join(', ');
    return headerVal;
}

async function get(label, url, extraParams) {
    const auth = oauthHeader('GET', url.split('?')[0], extraParams);
    const r = await fetch(url, { headers: { 'Authorization': auth } });
    const b = await r.json().catch(() => ({}));
    console.log('\\n=== ' + label + ' === Status:' + r.status);
    console.log(JSON.stringify(b, null, 2).substring(0, 2000));
}

async function main() {
    console.log('userId:', userId, 'consumerKey:', consumerKey);

    // v1.1 - verify credentials (get authenticated user)
    await get('v1.1 Verify Credentials', 'https://api.twitter.com/1.1/account/verify_credentials.json?include_entities=false&skip_status=true&include_email=false');

    // v1.1 - user show
    await get('v1.1 User Show', 'https://api.twitter.com/1.1/users/show.json?user_id=' + userId);

    // v1.1 - user timeline
    await get('v1.1 User Timeline', 'https://api.twitter.com/1.1/statuses/user_timeline.json?user_id=' + userId + '&count=5&tweet_mode=extended');

    // v1.1 - account activity (for analytics)
    await get('v1.1 Favorites', 'https://api.twitter.com/1.1/favorites/list.json?user_id=' + userId + '&count=5');
}
main().catch(e => console.error('ERROR:', e));
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/x_oauth1.js');
        s.on('close', () => {
            conn.exec('node /tmp/x_oauth1.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
