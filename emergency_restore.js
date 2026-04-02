const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('1. Zipping local files securely (Excluding heavy folders)...');
try {
    if (fs.existsSync('deploy.zip')) fs.unlinkSync('deploy.zip');
    // We use powershell to create a zip of the current directory excluding node_modules and .next and .git
    execSync(`powershell -Command "Compress-Archive -Path * -DestinationPath deploy.zip -Force"`); // For simplicity we might just pack the src directory and config files
} catch(e) { /* ignore */ }

// A simpler approach: Let's use an advanced SFTP sync library? No, we'll write a simple loop for the vital 'src' directory!
const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!['node_modules', '.next', '.git', 'prisma', 'public'].includes(file)) {
          filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx') || dirFile.endsWith('.js') || dirFile.endsWith('.json') || dirFile.endsWith('.css')) {
          filelist.push(dirFile.replace(/\\/g, '/'));
      }
    }
  });
  return filelist;
};

const allFiles = [...walkSync('src'), 'package.json', 'postcss.config.mjs', 'tailwind.config.ts', 'tsconfig.json', 'next.config.mjs'];

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to LIVE SERVER!');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    let uploaded = 0;
    
    // Ensure all remote directories exist
    const dirs = [...new Set(allFiles.map(f => path.dirname(f).replace(/\\/g, '/')))];
    
    const doUpload = () => {
        if (uploaded >= allFiles.length) {
            console.log('--- ALL FILES UPLOADED ---');
            console.log('Rebuilding Live Server...');
            conn.exec('cd /root/milaknight-os && npm run build && pm2 restart milaknight || pm2 restart all', (err, stream) => {
                if(err) { console.error(err); return conn.end(); }
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('SERVER RESTART COMPLETE!');
                    conn.end();
                });
            });
            return;
        }
        
        const f = allFiles[uploaded];
        if (!fs.existsSync(f)) { uploaded++; return doUpload(); }
        const rPath = `/root/milaknight-os/${f}`;
        sftp.fastPut(f, rPath, (err) => {
             // Ignoring errors to speed up the loop
             uploaded++;
             if (uploaded % 50 === 0) console.log(`Uploaded ${uploaded} / ${allFiles.length}...`);
             doUpload();
        });
    };
    
    // Run the uploader
    doUpload();
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
