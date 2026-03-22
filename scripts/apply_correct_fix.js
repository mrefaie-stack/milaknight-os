const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Applying correct fix for operations_controller.rb...');
    
    // The correct fix:
    // ContentPhoto has 'has_one_attached :photo'
    // So to check if it's attached: photo.photo.attached?   (first photo = instance, second photo = AS attachment)
    // And to get URL: url_for(photo.photo)
    
    const fixCmds = [
        // Fix the incorrect sed output - replace all the broken checks with correct ones
        'docker exec backend_elsaigh-app-1 sed -i "s/photo.respond_to?(:photo) && try(:photo).try(:attached?)/photo.photo.attached?/g" app/controllers/operations_controller.rb',
        'docker exec backend_elsaigh-app-1 sed -i "s/respond_to?(:photo) && try(:photo).try(:attached?)/photo.photo.attached?/g" app/controllers/operations_controller.rb',
        // Also fix if there's url_for(photo) that should be url_for(photo.photo)
        'docker exec backend_elsaigh-app-1 sed -i "s/photo.photo.attached? ? url_for(photo) :/photo.photo.attached? ? url_for(photo.photo) :/g" app/controllers/operations_controller.rb',
        'echo "--- Fixed controller (lines 50-80) ---"',
        'docker exec backend_elsaigh-app-1 sed -n "50,80p" app/controllers/operations_controller.rb',
        'docker restart backend_elsaigh-app-1'
    ];
    
    conn.exec(fixCmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('\nFix applied and container restarted.');
            conn.end();
        }).on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
    });
}).connect({
    host: '72.61.162.106',
    port: 22,
    username: 'root',
    password: ';hdFJ6C1?YYc6FD8gdY2'
});
