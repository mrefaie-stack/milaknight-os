const { Client } = require('ssh2');
const conn = new Client();
const script = `
const fs = require('fs');
const env = fs.readFileSync('/root/milaknight-os/.env', 'utf8');
for (const line of env.split('\\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) process.env[line.substring(0,idx).trim()] = line.substring(idx+1).trim();
}

const apiKey = process.env.X_API_KEY;
const apiSecret = process.env.X_API_SECRET;
const accessToken = process.env.X_ACCESS_TOKEN;
const accessSecret = process.env.X_ACCESS_SECRET;
const userId = process.env.X_USER_ID;

async function main() {
    console.log('API Key:', apiKey);

    // Generate Bearer Token from API Key + Secret
    const creds = Buffer.from(apiKey + ':' + apiSecret).toString('base64');
    const tokenRes = await fetch('https://api.twitter.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + creds,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const tokenData = await tokenRes.json();
    console.log('\\n=== Bearer Token Generation === Status:', tokenRes.status);
    console.log(JSON.stringify(tokenData, null, 2));

    if (!tokenData.access_token) return;
    const bearer = tokenData.access_token;
    console.log('\\nNew Bearer Token:', bearer.substring(0, 40) + '...');

    const h = { 'Authorization': 'Bearer ' + bearer };

    // Test user lookup
    const userRes = await fetch('https://api.twitter.com/2/users/' + userId + '?user.fields=public_metrics,name,username,description', { headers: h });
    const userData = await userRes.json();
    console.log('\\n=== User Lookup === Status:', userRes.status);
    console.log(JSON.stringify(userData, null, 2));

    // Test tweets
    const tweetsRes = await fetch('https://api.twitter.com/2/users/' + userId + '/tweets?max_results=5&tweet.fields=public_metrics,created_at', { headers: h });
    const tweetsData = await tweetsRes.json();
    console.log('\\n=== Recent Tweets === Status:', tweetsRes.status);
    console.log(JSON.stringify(tweetsData, null, 2).substring(0, 2000));

    // Update .env with correct bearer token
    let envContent = fs.readFileSync('/root/milaknight-os/.env', 'utf8');
    envContent = envContent.replace(/^X_BEARER_TOKEN=.*$/m, 'X_BEARER_TOKEN=' + bearer);
    fs.writeFileSync('/root/milaknight-os/.env', envContent);
    console.log('\\n.env updated with new Bearer Token');
}
main().catch(e => console.error('ERROR:', e));
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/x_bearer.js');
        s.on('close', () => {
            conn.exec('node /tmp/x_bearer.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
