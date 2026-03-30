const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        `grep -q '^GOOGLE_ADS_DEVELOPER_TOKEN=' /root/milaknight-os/.env`,
        `&& sed -i 's|^GOOGLE_ADS_DEVELOPER_TOKEN=.*|GOOGLE_ADS_DEVELOPER_TOKEN="PmGh0-E3jBShPUqEtS1bZA"|' /root/milaknight-os/.env`,
        `|| echo 'GOOGLE_ADS_DEVELOPER_TOKEN="PmGh0-E3jBShPUqEtS1bZA"' >> /root/milaknight-os/.env`,
        `&& echo "--- Google vars ---"`,
        `&& grep 'GOOGLE' /root/milaknight-os/.env`,
        `&& pm2 restart milaknight`
    ].join(' ');
    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
