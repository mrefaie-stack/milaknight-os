const { Client } = require('ssh2');
const conn = new Client();
const script = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const snaps = await prisma.socialConnection.findMany({
        where: { platform: 'SNAPCHAT', clientId: 'cmmko1u8t000bi1ect27lj6qz' },
        select: { id: true, platformAccountId: true, platformAccountName: true,
                  refreshToken: true, expiresAt: true, isActive: true }
    });
    snaps.forEach(s => {
        console.log('ID:', s.id);
        console.log('Account:', s.platformAccountName, '(', s.platformAccountId, ')');
        console.log('Has refreshToken:', !!s.refreshToken, s.refreshToken ? '(len=' + s.refreshToken.length + ')' : '');
        console.log('ExpiresAt:', s.expiresAt);
        console.log('---');
    });

    // Try to refresh the token manually
    const conn = snaps.find(s => s.refreshToken);
    if (conn) {
        console.log('\\nAttempting token refresh...');
        const res = await fetch('https://accounts.snapchat.com/accounts/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: process.env.SNAPCHAT_CLIENT_ID || '207e6a38-bbff-4248-b410-90988d33417d',
                client_secret: process.env.SNAPCHAT_CLIENT_SECRET || '621ed85f11f38e31a0c5',
                refresh_token: conn.refreshToken
            })
        });
        const data = await res.json();
        if (data.access_token) {
            console.log('Refresh SUCCESS - new token len:', data.access_token.length);
            console.log('expires_in:', data.expires_in);
        } else {
            console.log('Refresh FAILED:', JSON.stringify(data));
        }
    } else {
        console.log('No connection with refresh token found!');
    }
}
main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
`;
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/check_snap_tok.js');
        s.on('close', () => {
            conn.exec('cd /root/milaknight-os && node /tmp/check_snap_tok.js 2>&1', (err2, stream) => {
                if (err2) throw err2;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
        s.end(script);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
