const { execSync } = require('child_process');

const SSH = 'ssh -o ConnectTimeout=10 -o BatchMode=yes root@72.61.162.106';

function run(label, cmd) {
    console.log(`\n===== ${label} =====`);
    try {
        const result = execSync(`${SSH} '${cmd}'`, { timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] });
        console.log(result.toString() || '(empty output)');
    } catch (e) {
        const out = e.stdout ? e.stdout.toString() : '';
        const err = e.stderr ? e.stderr.toString() : e.message;
        if (out) console.log(out);
        if (err) console.log('ERR:', err.substring(0, 300));
    }
}

run('Nginx error log last 20 lines', 'tail -n 20 /var/log/nginx/error.log');
run('Disk space', 'df -h /');
run('Nginx status', 'systemctl is-active nginx');
run('Home dir permissions', 'ls -la /home/');
run('Milaknight dir', 'ls -la /home/milaknight/ 2>/dev/null || echo NOT_FOUND');
run('Config files', 'ls /etc/nginx/conf.d/');
