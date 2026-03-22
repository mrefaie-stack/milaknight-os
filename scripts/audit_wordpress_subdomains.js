const { execSync } = require('child_process');

const SSH_COMMAND = 'ssh root@72.61.162.106';

try {
    console.log('--- Finding mila-knight.com subdomains in Nginx ---');
    const findConfigs = execSync(`${SSH_COMMAND} "grep -r 'server_name .*mila-knight.com' /etc/nginx/conf.d/"`).toString();
    console.log(findConfigs);
    
    console.log('\n--- Checking the folder paths and permissions ---');
    // Simple script to find the root directory of these domains
    const getRoots = execSync(`${SSH_COMMAND} "grep -r 'root ' /etc/nginx/conf.d/ | grep mila-knight"`).toString();
    console.log(getRoots);
    
    console.log('\n--- Checking recent Nginx Error Logs ---');
    const logs = execSync(`${SSH_COMMAND} "tail -n 30 /var/log/nginx/error.log"`).toString();
    console.log(logs);
    
} catch (error) {
    console.error('Error executing SSH command:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout.toString());
    if (error.stderr) console.error('STDERR:', error.stderr.toString());
}
