const { Client } = require('ssh2');
const conn = new Client();
const script = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const conn = await prisma.socialConnection.findFirst({
        where: { platform: 'SNAPCHAT', clientId: 'cmmko1u8t000bi1ect27lj6qz', isActive: true }
    });
    if (!conn) { console.log('NO CONNECTION FOUND'); return; }
    console.log('Connection:', conn.platformAccountId, conn.platformAccountName);
    console.log('ExpiresAt:', conn.expiresAt, '| Now:', new Date());
    console.log('Expired?', conn.expiresAt && new Date(conn.expiresAt) <= new Date());

    const meta = conn.metadata ? JSON.parse(conn.metadata) : {};
    console.log('OrgId:', meta.orgId);
    console.log('AdAccounts:', JSON.stringify(meta.adAccounts));

    // Try to refresh token first
    let token = conn.accessToken;
    if (conn.expiresAt && new Date(conn.expiresAt) <= new Date() && conn.refreshToken) {
        console.log('\\nRefreshing token...');
        const res = await fetch('https://accounts.snapchat.com/accounts/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: '207e6a38-bbff-4248-b410-90988d33417d',
                client_secret: '621ed85f11f38e31a0c5',
                refresh_token: conn.refreshToken
            })
        });
        const data = await res.json();
        if (data.access_token) {
            token = data.access_token;
            console.log('Token refreshed OK');
            await prisma.socialConnection.update({
                where: { id: conn.id },
                data: { accessToken: data.access_token, expiresAt: new Date(Date.now() + data.expires_in * 1000) }
            });
        } else {
            console.log('Refresh FAILED:', JSON.stringify(data));
        }
    } else {
        console.log('Token still valid');
    }

    // Test each ad account
    for (const acc of (meta.adAccounts || [])) {
        console.log('\\n--- Ad Account:', acc.id, acc.name);
        const since = new Date(); since.setDate(since.getDate() - 30);
        const startTime = Math.floor(new Date(since.toISOString().split('T')[0] + 'T00:00:00Z').getTime() / 1000);
        const endTime = Math.floor(new Date().getTime() / 1000);

        const url = new URL('https://adsapi.snapchat.com/v1/adaccounts/' + acc.id + '/stats');
        url.searchParams.set('granularity', 'TOTAL');
        url.searchParams.set('fields', 'impressions,swipes,spend,video_views,reach');
        url.searchParams.set('start_time', startTime.toString());
        url.searchParams.set('end_time', endTime.toString());

        console.log('Request URL:', url.toString());
        const r = await fetch(url.toString(), { headers: { Authorization: 'Bearer ' + token } });
        const body = await r.json();
        console.log('Status:', r.status);
        console.log('Response:', JSON.stringify(body, null, 2).substring(0, 1000));
    }

    // Also try org-level: list all ad accounts live from API
    console.log('\\n--- Fetching ad accounts from API (live)...');
    const orgId = meta.orgId || conn.platformAccountId;
    const r2 = await fetch('https://adsapi.snapchat.com/v1/organizations/' + orgId + '/adaccounts', {
        headers: { Authorization: 'Bearer ' + token }
    });
    const d2 = await r2.json();
    console.log('Ad accounts from API:', JSON.stringify(d2, null, 2).substring(0, 2000));
}
main().catch(e => console.error(e.message)).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/diag_snap.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/diag_snap.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
