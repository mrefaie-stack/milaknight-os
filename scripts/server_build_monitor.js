const { Client } = require('ssh2');

const conn = new Client();
const serverConfig = {
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
};

conn.on('ready', () => {
  console.log('✅ Connected to Server via SSH');
  console.log('⏳ Running `npm run build` safely on Server. This might take 1-3 minutes...');
  
  // Notice we write stdout directly
  conn.exec(`cd /root/milaknight-os && npm run build && pm2 restart milaknight`, (err, stream) => {
    if (err) {
      console.error('Execute error:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log('✅ SERVER BUILD AND RESTART COMPLETE! Code: ' + code);
      conn.end();
      process.exit(code); // Propagate exit code
    })
    .on('data', (data) => {
      process.stdout.write(data);
    })
    .stderr.on('data', (data) => {
      process.stdout.write(data); // Write stderr to stdout so we can track it easily
    });
  });
}).on('error', (err) => {
  console.error('SSH Connection Error:', err);
  process.exit(1);
}).connect(serverConfig);
