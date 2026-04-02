const { Client } = require('ssh2');
const path = require('path');

const filesToUpload = [
  {
    local: path.join(__dirname, 'src/lib/ai/gemini.ts'),
    remote: '/root/milaknight-os/src/lib/ai/gemini.ts'
  },
  {
    local: path.join(__dirname, 'src/app/api/seo/content-optimizer/route.ts'),
    remote: '/root/milaknight-os/src/app/api/seo/content-optimizer/route.ts'
  }
];

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected. Uploading SEO fixes via SFTP...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    let pending = filesToUpload.length;

    for (const file of filesToUpload) {
      sftp.fastPut(file.local, file.remote, (err2) => {
        if (err2) {
          console.error('Upload error for', file.local, ':', err2);
        } else {
          console.log('Uploaded:', file.remote);
        }
        pending--;
        if (pending === 0) {
          console.log('\nStarting build...');
          conn.exec('cd /root/milaknight-os && npm run build 2>&1 && pm2 restart milaknight && pm2 status', (err3, stream) => {
            if (err3) throw err3;
            stream.on('close', (code) => {
              console.log('\nDone. Exit code:', code);
              conn.end();
            }).on('data', (data) => process.stdout.write(data))
              .stderr.on('data', (data) => process.stderr.write(data));
          });
        }
      });
    }
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
