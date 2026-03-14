const { Client: SSH2Client } = require('C:/Users/madao/.gemini/antigravity/playground/milaknight-os/node_modules/ssh2');

const conn = new SSH2Client();

const commands = [
  'cd /root/milaknight-os',
  'git fetch origin',
  'git reset --hard origin/main',
  'npm ci --production=false',
  'npx prisma db push --accept-data-loss',
  'npm run build',
  'pm2 restart milaknight || pm2 restart all',
  'pm2 status'
].join(' && ');

const HOST = '38.242.134.148';
const USER = 'root';
const PASS = 'Mila@2024#Secure!';

console.log('Connecting to', HOST, '...');
console.log('Password length:', PASS.length);
console.log('Password chars:', [...PASS].map(c => c.charCodeAt(0)));

conn.on('ready', () => {
  console.log('Connected! Starting deployment...\n');
  console.log('='.repeat(60));

  conn.exec(commands, { pty: true }, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('close', (code, signal) => {
      console.log('\n' + '='.repeat(60));
      console.log(`Process exited with code: ${code}, signal: ${signal}`);
      conn.end();
      if (code === 0 || code === null) {
        console.log('\nDeployment SUCCESSFUL!');
        process.exit(0);
      } else {
        console.error(`\nDeployment FAILED with exit code: ${code}`);
        process.exit(1);
      }
    });

    stream.on('data', (data) => {
      process.stdout.write(data);
    });

    stream.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('keyboard-interactive', (_name, _instructions, _lang, _prompts, finish) => {
  console.log('Keyboard-interactive auth triggered, sending password...');
  finish([PASS]);
}).on('error', (err) => {
  console.error('Connection error:', err);
  process.exit(1);
}).connect({
  host: HOST,
  port: 22,
  username: USER,
  password: PASS,
  tryKeyboard: true,
  readyTimeout: 60000,
  algorithms: {
    kex: [
      'ecdh-sha2-nistp256',
      'ecdh-sha2-nistp384',
      'ecdh-sha2-nistp521',
      'diffie-hellman-group-exchange-sha256',
      'diffie-hellman-group14-sha256',
      'diffie-hellman-group14-sha1',
    ],
    serverHostKey: [
      'ssh-rsa',
      'ecdsa-sha2-nistp256',
      'ecdsa-sha2-nistp384',
      'ecdsa-sha2-nistp521',
      'ssh-ed25519',
    ],
  },
  debug: (msg) => {
    console.log('[SSH]', msg);
  }
});
