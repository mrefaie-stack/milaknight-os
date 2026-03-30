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
const tokenSecret = process.env.X_ACCESS_SECRET;
const userId = process.env.X_USER_ID;

function buildAuthHeader(method, fullUrl, queryParams = {}) {
    const baseUrl = fullUrl.split('?')[0];

    const oauthParams = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: String(Math.floor(Date.now() / 1000)),
        oauth_token: accessToken,
        oauth_version: '1.0'
    };

    // Include query params in signature
    const allParams = { ...oauthParams, ...queryParams };
    const paramStr = Object.keys(allParams).sort()
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(allParams[k]))
        .join('&');

    const base = method.toUpperCase() + '&' + encodeURIComponent(baseUrl) + '&' + encodeURIComponent(paramStr);
    const sigKey = encodeURIComponent(consumerSecret) + '&' + encodeURIComponent(tokenSecret);
    const sig = crypto.createHmac('sha1', sigKey).update(base).digest('base64');
    oauthParams.oauth_signature = sig;

    return 'OAuth ' + Object.entries(oauthParams)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([k,v]) => encodeURIComponent(k) + '="' + encodeURIComponent(v) + '"')
        .join(', ');
}

async function getOAuth(label, baseUrl, queryParams = {}) {
    const qs = new URLSearchParams(queryParams).toString();
    const fullUrl = qs ? baseUrl + '?' + qs : baseUrl;
    const auth = buildAuthHeader('GET', baseUrl, queryParams);
    const r = await fetch(fullUrl, { headers: { 'Authorization': auth } });
    const b = await r.json().catch(() => ({}));
    console.log('\\n=== ' + label + ' === Status:' + r.status);
    console.log(JSON.stringify(b, null, 2).substring(0, 3000));
}

async function main() {
    console.log('userId:', userId, 'consumerKey:', consumerKey);

    await getOAuth('Verify Credentials', 'https://api.twitter.com/1.1/account/verify_credentials.json', {
        include_entities: 'false', skip_status: 'true', include_email: 'false'
    });

    await getOAuth('User Show', 'https://api.twitter.com/1.1/users/show.json', {
        user_id: userId, include_entities: 'false'
    });

    await getOAuth('User Timeline', 'https://api.twitter.com/1.1/statuses/user_timeline.json', {
        user_id: userId, count: '5', tweet_mode: 'extended', include_rts: 'false'
    });
}
main().catch(e => console.error('ERROR:', e));
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/x_oauth1b.js');
        s.on('close', () => {
            conn.exec('node /tmp/x_oauth1b.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
