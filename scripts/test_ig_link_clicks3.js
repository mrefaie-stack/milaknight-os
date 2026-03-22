const { Client } = require('ssh2');

const testScript = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const conn = await prisma.socialConnection.findFirst({ where: { platform: 'FACEBOOK', isActive: true } });
    const pt = conn.accessToken;
    const since = '2026-03-01';
    const until = '2026-03-22';

    // Find the right ad account for this client (Dr.Saigh = السمنة Over obesity)
    // from logs: act_ + account_id from connection.metadata?
    const meta = JSON.parse(conn.metadata || '{}');
    console.log('Connection metadata:', JSON.stringify(meta));

    // Check if there's adAccountId stored
    const adAccountId = meta.adAccountId || meta.ad_account_id;
    if (adAccountId) {
        console.log('Found adAccountId:', adAccountId);
    }

    // Try Dr.Saigh ad account (1550475246092769)
    const testAccounts = ['act_1550475246092769'];

    for (const adId of testAccounts) {
        console.log('\\n--- Testing', adId, '---');

        // Correct breakdown syntax
        const url = 'https://graph.facebook.com/v19.0/' + adId + '/insights?fields=actions,clicks,spend&breakdowns=publisher_platform&time_range=' + encodeURIComponent(JSON.stringify({since, until})) + '&access_token=' + pt;
        const r = await fetch(url);
        const d = await r.json();
        if (d.error) {
            console.log('ERROR:', d.error.message.substring(0, 150));

            // Try without breakdown
            const url2 = 'https://graph.facebook.com/v19.0/' + adId + '/insights?fields=actions,clicks,spend&time_range=' + encodeURIComponent(JSON.stringify({since, until})) + '&access_token=' + pt;
            const r2 = await fetch(url2);
            const d2 = await r2.json();
            if (d2.error) {
                console.log('No-breakdown ERROR:', d2.error.message.substring(0, 150));
            } else {
                const row = d2.data?.[0];
                if (row) {
                    console.log('Total clicks:', row.clicks, '| spend:', row.spend);
                    for (const a of row.actions || []) {
                        if (a.action_type.includes('link') || a.action_type.includes('click') || a.action_type.includes('landing')) {
                            console.log('  action:', a.action_type, '=', a.value);
                        }
                    }
                    // Show ALL actions
                    console.log('All actions:');
                    for (const a of row.actions || []) {
                        console.log(' ', a.action_type, '=', a.value);
                    }
                }
            }
        } else {
            for (const row of d.data || []) {
                console.log('Platform:', row.publisher_platform, '| clicks:', row.clicks);
                const lcAction = (row.actions || []).find(a => a.action_type === 'link_click');
                if (lcAction) console.log('  link_click =', lcAction.value);
            }
        }
    }

    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
`;

const sshConn = new Client();
sshConn.on('ready', () => {
    sshConn.sftp((err, sftp) => {
        if (err) { console.error(err); sshConn.end(); return; }
        const stream = sftp.createWriteStream('/tmp/test_ig_lc3.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_ig_lc3.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
