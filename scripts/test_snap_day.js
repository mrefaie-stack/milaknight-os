const { Client } = require('ssh2');
const conn = new Client();
const script = `
async function main() {
    const token = process.env.SNAP_TOKEN;
    const adAccountId = '64c47830-10f4-4d3b-ab1f-d5f12da81cdf';

    // Try granularity=DAY
    const since = new Date(); since.setDate(since.getDate() - 7);
    const startTime = Math.floor(since.getTime() / 1000);
    const endTime = Math.floor(new Date().getTime() / 1000);

    console.log('start_time:', startTime, '| end_time:', endTime);
    console.log('Start date:', new Date(startTime * 1000).toISOString());
    console.log('End date:', new Date(endTime * 1000).toISOString());

    // Test 1: granularity=DAY
    const url = 'https://adsapi.snapchat.com/v1/adaccounts/' + adAccountId + '/stats?granularity=DAY&fields=impressions,swipes,spend,video_views,reach&start_time=' + startTime + '&end_time=' + endTime;
    console.log('\\n--- Test 1: granularity=DAY ---');
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    const body = await r.json();
    console.log('Status:', r.status);
    console.log('Response:', JSON.stringify(body, null, 2).substring(0, 2000));

    // Test 2: try with omit_empty=false
    console.log('\\n--- Test 2: TOTAL omit_empty=false ---');
    const url2 = 'https://adsapi.snapchat.com/v1/adaccounts/' + adAccountId + '/stats?granularity=TOTAL&fields=impressions,swipes,spend,video_views,reach&start_time=' + startTime + '&end_time=' + endTime + '&omit_empty=false';
    const r2 = await fetch(url2, { headers: { Authorization: 'Bearer ' + token } });
    const body2 = await r2.json();
    console.log('Status:', r2.status);
    console.log('Response:', JSON.stringify(body2, null, 2).substring(0, 2000));

    // Test 3: Check if there's a public profile
    console.log('\\n--- Test 3: Public Profiles for org ---');
    const orgId = 'b253ae21-d73e-4618-8aa4-6d42944a2dda';
    const r3 = await fetch('https://adsapi.snapchat.com/v1/organizations/' + orgId + '/public_profiles', {
        headers: { Authorization: 'Bearer ' + token }
    });
    const body3 = await r3.json();
    console.log('Status:', r3.status);
    console.log('Public Profiles:', JSON.stringify(body3, null, 2).substring(0, 2000));
}
main().catch(e => console.error(e.message));
`;
conn.on('ready', () => {
    conn.exec(`cd /root/milaknight-os && SNAP_TOKEN=$(node -e "const {PrismaClient}=require('./node_modules/@prisma/client');const p=new PrismaClient();p.socialConnection.findFirst({where:{platform:'SNAPCHAT',clientId:'cmmko1u8t000bi1ect27lj6qz',isActive:true}}).then(c=>{console.log(c.accessToken);p.\$disconnect()})" 2>/dev/null) && echo "$SNAP_TOKEN" | head -c 20 && node -e "${script.replace(/`/g, '\\`')}" 2>&1`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
