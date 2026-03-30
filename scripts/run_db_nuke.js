/**
 * run_db_nuke.js
 * Uploads db_nuke.js to the server and runs it via SSH.
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH = { host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' };
const LOCAL_SCRIPT = path.join(__dirname, 'db_nuke.js');
const REMOTE_SCRIPT = '/root/milaknight-os/scripts/db_nuke.js';

const conn = new Client();
conn.on('ready', () => {
  console.log('🔗 Connected to server\n');
  console.log('📤 Uploading db_nuke.js...');

  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(LOCAL_SCRIPT, REMOTE_SCRIPT, {}, (err) => {
      if (err) throw err;
      console.log('✓ Uploaded\n');
      console.log('🚀 Running cleanup script on server...\n');

      conn.exec(
        'cd /root/milaknight-os && node scripts/db_nuke.js',
        (err, stream) => {
          if (err) throw err;
          stream
            .on('close', (code) => {
              console.log(`\n--- Script exited with code: ${code} ---`);
              conn.end();
            })
            .on('data', (data) => process.stdout.write(data.toString()))
            .stderr.on('data', (data) => process.stderr.write(data.toString()));
        }
      );
    });
  });
}).connect(SSH);
