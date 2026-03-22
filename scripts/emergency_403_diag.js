const { execSync } = require('child_process');

const SSH = 'ssh root@72.61.162.106';

function run(cmd, label) {
    console.log(`\n\n===== ${label} =====`);
    try {
        const out = execSync(`${SSH} "${cmd}"`, { timeout: 30000 }).toString();
        console.log(out);
    } catch (e) {
        const out = e.stdout ? e.stdout.toString() : e.message;
        const err = e.stderr ? e.stderr.toString() : '';
        console.log(out);
        if (err) console.error(err);
    }
}

// 1. Check nginx status
run('systemctl status nginx --no-pager', 'Nginx Status');

// 2. Check disk space - 403 can happen if disk is full
run('df -h', 'Disk Usage');

// 3. Check nginx config validity
run('nginx -t 2>&1', 'Nginx Config Test');

// 4. Check permissions on the main milaknight folder
run('ls -la /home/milaknight/', 'Milaknight Home Permissions');

// 5. Check recent nginx error logs
run('tail -n 50 /var/log/nginx/error.log 2>&1', 'Nginx Error Logs (last 50 lines)');

// 6. Check which conf files exist
run('ls -la /etc/nginx/conf.d/', 'Nginx conf.d files');

// 7. Check one specific config
run('cat /etc/nginx/conf.d/dashboard.mila-knight.com.conf 2>/dev/null || echo FILE_NOT_FOUND', 'dashboard.mila-knight.com config');
