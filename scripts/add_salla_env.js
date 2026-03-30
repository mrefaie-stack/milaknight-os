const { execSync } = require('child_process');

const vars = [
    ['SALLA_CLIENT_ID', '1ba0fc75-b543-4d71-b239-79f4011ad377'],
    ['SALLA_CLIENT_SECRET', '2bdad8cf1c6a0198920780849396ebdf82ba1dc9d74f38f8b7677f4f07d17d36'],
    ['SALLA_WEBHOOK_SECRET', '734d5f1d77cc31bb66df53293fc7b2107ca81c47c23f5dfda134951309daf980'],
];

const commands = vars.map(([key, val]) =>
    `grep -q '${key}' /var/www/milaknight-os/.env && sed -i 's|^${key}=.*|${key}=${val}|' /var/www/milaknight-os/.env || echo '${key}=${val}' >> /var/www/milaknight-os/.env`
).join(' && ');

const full = `ssh root@209.38.242.17 "${commands} && echo 'All done'"`;

try {
    const result = execSync(full, { encoding: 'utf8', timeout: 30000 });
    console.log(result);
} catch (e) {
    console.error(e.message);
}
