const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to server');

  // First update the .env on the server, then deploy
  const cmd = `
    cd /root/milaknight-os &&

    echo "=== Updating .env with LiveKit credentials ===" &&
    # Remove old TURN vars, add LiveKit vars
    sed -i '/^TURN_HOST/d' .env
    sed -i '/^TURN_PORT/d' .env
    sed -i '/^TURN_USERNAME/d' .env
    sed -i '/^TURN_CREDENTIAL/d' .env

    grep -q "LIVEKIT_URL" .env || echo "LIVEKIT_URL=wss://milaknights-8pi94zc4.livekit.cloud" >> .env
    grep -q "LIVEKIT_API_KEY" .env || echo "LIVEKIT_API_KEY=API52eNnHrABdwy" >> .env
    grep -q "LIVEKIT_API_SECRET" .env || echo "LIVEKIT_API_SECRET=LRdlnoB3schDmDXuK1qFQsfioeVNF5YXo2OntS4W57B" >> .env
    grep -q "NEXT_PUBLIC_LIVEKIT_URL" .env || echo "NEXT_PUBLIC_LIVEKIT_URL=wss://milaknights-8pi94zc4.livekit.cloud" >> .env

    echo "=== .env updated ===" &&

    echo "=== Deploying ===" &&
    git fetch origin &&
    git reset --hard origin/main &&
    npm ci --production=false &&
    npx prisma generate &&
    npx prisma db push --accept-data-loss &&
    npm run build &&
    pm2 restart milaknight &&
    echo "=== Deploy complete ===" &&
    pm2 status
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\nDone, exit code:', code);
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
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
