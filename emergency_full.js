const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!['node_modules', '.next', '.git', 'public'].includes(file)) {
          filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx') || dirFile.endsWith('.js') || dirFile.endsWith('.json') || dirFile.endsWith('.css') || dirFile.endsWith('.prisma')) {
          filelist.push(dirFile.replace(/\\/g, '/'));
      }
    }
  });
  return filelist;
};

// We MUST include prisma folder for database schema sync!
const allFiles = [...walkSync('src'), ...walkSync('prisma'), 'package.json', 'postcss.config.mjs', 'tailwind.config.ts', 'tsconfig.json', 'next.config.mjs'];

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to LIVE SERVER! Starting Full Sync...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    let uploaded = 0;
    
    // Create necessary folders remotely
    const createDirs = () => {
       conn.exec('mkdir -p /root/milaknight-os/prisma /root/milaknight-os/src', (err) => {
           if(err) console.error(err);
           doUpload();
       });
    };
    
    const doUpload = () => {
        if (uploaded >= allFiles.length) {
            console.log('--- ALL FILES UPLOADED ---');
            console.log('Running Install, Prisma DB Sync, Build, and PM2 Restart... (Please wait 2-3 minutes)');
            const fullCommand = 'cd /root/milaknight-os && npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 restart milaknight || pm2 restart all';
            conn.exec(fullCommand, (err, stream) => {
                let out = '';
                if(err) { console.error(err); return conn.end(); }
                stream.on('data', d => { process.stdout.write('.'); out += d; });
                stream.stderr.on('data', d => { process.stdout.write('!'); out += d; });
                stream.on('close', () => {
                    console.log('\nSERVER FULLY RESTORED!');
                    fs.writeFileSync('server_build_log.txt', out);
                    conn.end();
                });
            });
            return;
        }
        
        const f = allFiles[uploaded];
        if (!fs.existsSync(f)) { uploaded++; return doUpload(); }
        const rPath = `/root/milaknight-os/${f}`;
        sftp.fastPut(f, rPath, (err) => {
             uploaded++;
             if (uploaded % 50 === 0) console.log(`Synced ${uploaded} / ${allFiles.length}...`);
             doUpload();
        });
    };
    
    createDirs();
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
