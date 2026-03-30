const { execSync } = require('child_process');

const command = `ssh root@209.38.242.17 "grep -q SALLA_WEBHOOK_SECRET /var/www/milaknight-os/.env || echo 'SALLA_WEBHOOK_SECRET=734d5f1d77cc31bb66df53293fc7b2107ca81c47c23f5dfda134951309daf980' >> /var/www/milaknight-os/.env && echo 'Done'"`;

try {
    const result = execSync(command, { encoding: 'utf8' });
    console.log(result);
} catch (e) {
    console.error(e.message);
}
