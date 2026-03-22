const { Client } = require('ssh2');

const testScript = `
const { PrismaClient } = require('/root/milaknight-os/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const conn = await prisma.socialConnection.findFirst({ where: { platform: 'FACEBOOK', isActive: true } });
    const pt = conn.accessToken;
    const since = '2026-03-01';
    const until = '2026-03-22';

    // Get ad accounts
    const aaRes = await fetch('https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id&access_token=' + pt);
    const aaData = await aaRes.json();
    console.log('Ad accounts:', (aaData.data || []).map(a => a.name + ' (' + a.account_id + ')').join(', '));

    for (const aa of (aaData.data || [])) {
        const adId = aa.id; // act_XXXX

        // Get Instagram link clicks from ads (action_type = link_click, publisher_platform = instagram)
        const url1 = 'https://graph.facebook.com/v19.0/' + adId + '/insights?fields=actions,publisher_platform&breakdowns=publisher_platform&time_range=' + encodeURIComponent(JSON.stringify({since, until})) + '&access_token=' + pt;
        const r1 = await fetch(url1);
        const d1 = await r1.json();
        if (d1.error) {
            console.log(aa.name + ' insights ERROR:', d1.error.message.substring(0, 100));
        } else {
            const igRows = (d1.data || []).filter(row => row.publisher_platform === 'instagram');
            let totalLinkClicks = 0;
            for (const row of igRows) {
                const lcAction = (row.actions || []).find(a => a.action_type === 'link_click' || a.action_type === 'landing_page_view');
                if (lcAction) {
                    console.log(aa.name + ' [instagram] link_click: ' + lcAction.value);
                    totalLinkClicks += Number(lcAction.value) || 0;
                }
            }
            if (totalLinkClicks === 0) {
                // Show all actions available
                const allActions = new Set();
                for (const row of d1.data || []) {
                    for (const a of row.actions || []) allActions.add(a.action_type);
                }
                console.log(aa.name + ' available action types:', [...allActions].join(', '));

                // Show IG-specific actions
                console.log('\\n--- All IG rows ---');
                for (const row of igRows) {
                    console.log('platform:', row.publisher_platform);
                    for (const a of row.actions || []) {
                        console.log('  action:', a.action_type, '=', a.value);
                    }
                }
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
        const stream = sftp.createWriteStream('/tmp/test_ig_lc2.js');
        stream.on('close', () => {
            sshConn.exec('cd /root/milaknight-os && node /tmp/test_ig_lc2.js 2>&1', (err2, execStream) => {
                if (err2) { console.error(err2); sshConn.end(); return; }
                execStream.on('data', d => process.stdout.write(d.toString()));
                execStream.stderr.on('data', d => process.stderr.write(d.toString()));
                execStream.on('close', () => sshConn.end());
            });
        });
        stream.end(testScript);
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
