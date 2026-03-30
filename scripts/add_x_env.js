const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // URL-decode the bearer token and add all X credentials to .env
    const bearerToken = 'AAAAAAAAAAAAAAAAAAAAAILl8QEAAAAANFkzIoiYHGtXqo%2B8wENXvb1%2BwM4%3D3XkWqwDWm7GN9ZeeJHu4CYfKg2GIG6suvZYLuqxEKmBvUyuH1D';
    const decoded = decodeURIComponent(bearerToken);
    const cmd = [
        `cd /root/milaknight-os`,
        // Remove old X vars if any
        `sed -i '/^X_/d' .env`,
        // Add new ones
        `echo 'X_BEARER_TOKEN=${decoded}' >> .env`,
        `echo 'X_API_KEY=nmdyRBcDQNjns70gzv9iKhTLA' >> .env`,
        `echo 'X_API_SECRET=7Jn7uAaz0qDvmN8sUbSI9vosaLqGcdO3ws64rp9CeLQSM5UNWf' >> .env`,
        `echo 'X_ACCESS_TOKEN=1987487309093326848-YjYkmYY1yCNThk7W77j29FsG6luBr3' >> .env`,
        `echo 'X_ACCESS_SECRET=ObCiiVFDzAsCV3BXL1zFXw0tdJZU9axSXe7v0WNNmt14S' >> .env`,
        `echo 'X_USER_ID=1987487309093326848' >> .env`,
        `grep '^X_' .env`
    ].join(' && ');

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '72.61.162.106', port: 22, username: 'root', password: ';hdFJ6C1?YYc6FD8gdY2' });
