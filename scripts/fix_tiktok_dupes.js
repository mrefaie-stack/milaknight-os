const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const c = new Client();

c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) { console.error(err); c.end(); return; }

        const remoteScript = '/root/milaknight-os/scripts/_fix_tiktok.cjs';
        const localScript = path.join(__dirname, '_fix_tiktok.cjs');

        fs.writeFileSync(localScript, `
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fix() {
    const clientId = 'cmmko1u8t000bi1ect27lj6qz'; // Dr Saigh

    // Get all TIKTOK connections for this client
    const conns = await p.socialConnection.findMany({
        where: { clientId, platform: 'TIKTOK' },
        orderBy: { updatedAt: 'desc' }
    });

    console.log('Found', conns.length, 'TIKTOK records');
    conns.forEach(c => console.log('  id:', c.id, '| platformAccountId:', c.platformAccountId, '| updatedAt:', c.updatedAt));

    if (conns.length <= 1) {
        console.log('Only one record, checking if selectedAdvertiserId is correct...');
        if (conns.length === 1) {
            const meta = conns[0].metadata ? JSON.parse(conns[0].metadata) : {};
            console.log('  selectedAdvertiserId:', meta.selectedAdvertiserId);
            console.log('  advertiserIds:', meta.advertiserIds);
        }
        return;
    }

    // Keep the newest (conns[0]), delete the rest
    const keepRecord = conns[0];
    const deleteIds = conns.slice(1).map(c => c.id);

    console.log('\\nKeeping:', keepRecord.id, '(platformAccountId:', keepRecord.platformAccountId, ')');
    console.log('Deleting:', deleteIds);

    // Delete duplicates
    await p.socialConnection.deleteMany({ where: { id: { in: deleteIds } } });
    console.log('Deleted', deleteIds.length, 'duplicate(s)');

    // Update the kept record: fix selectedAdvertiserId to 7553291332792188944 (Milaknight LLC-FZ_adv)
    const meta = keepRecord.metadata ? JSON.parse(keepRecord.metadata) : {};
    meta.selectedAdvertiserId = '7553291332792188944';

    await p.socialConnection.update({
        where: { id: keepRecord.id },
        data: {
            platformAccountName: 'Milaknight LLC-FZ_adv',
            metadata: JSON.stringify(meta)
        }
    });
    console.log('\\nUpdated record: selectedAdvertiserId = 7553291332792188944, name = Milaknight LLC-FZ_adv');

    // Show final state
    const final = await p.socialConnection.findMany({
        where: { clientId, platform: 'TIKTOK' }
    });
    console.log('\\nFinal TIKTOK records:', final.length);
    final.forEach(c => {
        const m = c.metadata ? JSON.parse(c.metadata) : {};
        console.log('  platformAccountId:', c.platformAccountId, '| selected:', m.selectedAdvertiserId, '| name:', c.platformAccountName);
    });
}

fix().catch(e => console.error('ERROR:', e.message)).finally(() => p.$disconnect());
`);

        sftp.fastPut(localScript, remoteScript, {}, (err2) => {
            fs.unlinkSync(localScript);
            if (err2) { console.error('sftp error:', err2); c.end(); return; }

            c.exec(`cd /root/milaknight-os && NODE_PATH=/root/milaknight-os/node_modules node ${remoteScript}`, (err3, stream) => {
                let out = '';
                stream.on('data', d => out += d);
                stream.stderr.on('data', d => out += d);
                stream.on('close', () => {
                    console.log(out);
                    c.exec(`rm -f ${remoteScript}`, (e, s) => { s.resume(); s.on('close', () => c.end()); });
                });
            });
        });
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
