const { Client } = require('ssh2');

// Fixed content with null assertions
const fixedContent = `import { PrismaClient } from '@prisma/client';
import { TikTokAPI } from './src/lib/tiktok-api';
import { MetaAPI } from './src/lib/meta-api';
import { SnapchatAPI } from './src/lib/snapchat-api';
import { GoogleAdsAPI } from './src/lib/google-ads-api';
import { YouTubeAPI } from './src/lib/youtube-api';

const prisma = new PrismaClient();

async function main() {
    console.log("=== API Integration Test ===");

    // Find a client who has social connections
    const clientConf = await prisma.socialConnection.findFirst({
        where: { isActive: true },
        include: { client: true }
    });

    if (!clientConf) {
        console.log("No active social connections found in database to test.");
        return;
    }

    const clientId = clientConf.clientId;
    console.log(\`Using Client ID: \${clientId} (\${clientConf.client?.name})\`);

    const connections = await prisma.socialConnection.findMany({
        where: { clientId, isActive: true }
    });

    for (const conn of connections) {
        console.log(\`\\nTesting Platform: \${conn.platform}\`);
        const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const until = new Date().toISOString().slice(0, 10);

        try {
            if (conn.platform === 'META' || conn.platform === 'FACEBOOK' || conn.platform === 'INSTAGRAM') {
                const meta = new MetaAPI(conn.accessToken);
                const info = await meta.getAdAccountInfo(conn.platformAccountId!);
                console.log("Meta success:", !!info);
            }
            else if (conn.platform === 'TIKTOK') {
                const api = new TikTokAPI(conn.accessToken);
                let advertiserId = conn.platformAccountId!;
                if (conn.metadata) {
                    const m = JSON.parse(conn.metadata);
                    advertiserId = m.selectedAdvertiserId || advertiserId;
                }
                const info = await api.getAdAccountStats(advertiserId, since, until);
                console.log("TikTok stats success:", !!info);
            }
            else if (conn.platform === 'SNAPCHAT') {
                const api = new SnapchatAPI(conn.accessToken);
                console.log("Snapchat instance created. Testing getAdAccounts...");
                const accounts = await api.getAdAccounts(conn.platformAccountId!);
                console.log("Snapchat success:", !!accounts);
            }
            else if (conn.platform === 'GOOGLE_ADS') {
                const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
                const api = new GoogleAdsAPI(conn.accessToken, devToken);
                const customers = await api.listAccessibleCustomers();
                console.log("Google Ads success:", customers.length);
            }
            else {
                console.log("Skipping API test for", conn.platform);
            }
        } catch (e: any) {
            console.error(\`Error testing \${conn.platform}:\`, e.message);
        }
    }

    await prisma.$disconnect();
}

main().catch(e => console.error(e));
`;

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected. Writing fixed api-test.ts...');
  // Write the fixed file
  const writeCmd = `cat > /root/milaknight-os/api-test.ts << 'ENDOFFILE'\n${fixedContent}\nENDOFFILE`;
  conn.exec(`cd /root/milaknight-os && printf '%s' ${JSON.stringify(fixedContent)} > api-test.ts && echo "File written successfully"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Write done, code:', code);
      conn.end();
    }).on('data', (data) => process.stdout.write(data))
      .stderr.on('data', (data) => process.stderr.write(data));
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
