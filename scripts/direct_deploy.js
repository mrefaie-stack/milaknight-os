const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const serverConfig = {
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
};

const REMOTE_BASE = '/root/milaknight-os';
const FILES_TO_UPLOAD = [
  'src/app/actions/auto-report.ts',
  'src/components/reporting/report-client-view.tsx',
  'src/lib/ai/tools.ts',
  'src/app/actions/insights.ts',
  'src/app/api/seo/analyze/route.ts',
  'src/app/api/seo/content-brief/route.ts',
  'src/app/api/seo/content-optimizer/route.ts',
  'src/app/api/seo/technical-audit/route.ts',
  'src/app/api/ai-chat/route.ts'
];

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    let uploaded = 0;

    const uploadNext = () => {
      if (uploaded >= FILES_TO_UPLOAD.length) {
        console.log('All files uploaded. Rebuilding server...');
        conn.exec(`cd ${REMOTE_BASE} && npm run build && pm2 restart milaknight || pm2 restart all && pm2 status`, (err, stream) => {
          if (err) throw err;
          stream.on('close', (code, signal) => {
            console.log('Rebuild logic finished with code: ' + code);
            conn.end();
          }).on('data', (data) => {
            console.log('STDOUT: ' + data);
          }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
          });
        });
        return;
      }

      const fileRelPath = FILES_TO_UPLOAD[uploaded];
      const localPath = path.join(__dirname, '..', fileRelPath);
      const remotePath = `${REMOTE_BASE}/${fileRelPath}`.replace(/\\/g, '/');

      console.log(`Uploading ${localPath} -> ${remotePath}`);
      try {
        if (!fs.existsSync(localPath)) {
            console.log(`Local file doesn't exist: ${localPath}, skipping.`);
            uploaded++;
            uploadNext();
            return;
        }
        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) {
            console.error(`Failed to upload ${fileRelPath}:`, err);
          } else {
            console.log(`Successfully uploaded ${fileRelPath}`);
          }
          uploaded++;
          uploadNext();
        });
      } catch (e) {
          console.error(e);
          uploaded++;
          uploadNext();
      }
    };

    uploadNext();
  });
}).connect(serverConfig);
