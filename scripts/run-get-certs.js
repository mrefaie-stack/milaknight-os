const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const scriptContent = fs.readFileSync(path.join(__dirname, 'get-all-certs.sh'), 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

conn.on('ready', () => {
  console.log('=== Connected — Getting LE certs ===\n');

  const uploadCmd = `cat > /tmp/get-certs.sh << 'ENDOFSCRIPT'\n${scriptContent}\nENDOFSCRIPT\nchmod +x /tmp/get-certs.sh && bash /tmp/get-certs.sh`;

  conn.exec(uploadCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\n=== Done, exit code:', code, '===');
      conn.end();
    }).on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2', readyTimeout: 30000 });

conn.on('error', err => console.error('Connection error:', err.message));
