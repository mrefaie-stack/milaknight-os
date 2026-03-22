const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Check the model file and ActiveStorage status inside the container
    const cmds = [
        'docker exec backend_elsaigh-app-1 cat app/models/content_photo.rb 2>/dev/null',
        'echo "\\n--- CHECKING RAILS STORAGE ---"',
        'docker exec backend_elsaigh-app-1 bundle exec rails runner "puts ContentPhoto.new.respond_to?(:photo) ? \'Has photo\' : \'No photo\'" 2>&1',
        'echo "\\n--- CHECKING DJANGO / OTHER LOGS ---"',
        'docker logs --tail 20 backend_drsaleeh-app-1 2>&1 | grep -i 500'
    ];
    
    conn.exec(cmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', d => process.stdout.write(d))
              .stderr.on('data', d => process.stderr.write(d));
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
