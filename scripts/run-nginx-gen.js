const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const scriptContent = fs.readFileSync(path.join(__dirname, 'nginx-gen.sh'), 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

conn.on('ready', () => {
  console.log('=== Connected — Uploading and running nginx generator ===\n');

  // Write script to server then execute
  const uploadCmd = `cat > /tmp/nginx-gen.sh << 'ENDOFSCRIPT'\n${scriptContent}\nENDOFSCRIPT\nchmod +x /tmp/nginx-gen.sh && bash /tmp/nginx-gen.sh`;

  conn.exec(uploadCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\n=== Done, exit code:', code, '===');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2',
  readyTimeout: 30000
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});
