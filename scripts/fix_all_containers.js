const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // 1. Verify elsaigh is now working
    // 2. Apply same fix to other containers that might share same code pattern
    const containers = [
        'backend_mila_knight-app-1',
        'tba_backend-app-1',
        'dr_almunifi_dashboard-app-1',
        'backend_drsaleeh-app-1',
        'backend_aburahmah-app-1'
    ];
    
    const fixCmds = [];
    
    // First verify elsaigh is clean now
    fixCmds.push('echo "--- ELSAIGH RECENT LOGS ---"');
    fixCmds.push('docker logs --tail 5 backend_elsaigh-app-1 2>&1');
    
    // Apply same correct fix to other containers
    containers.forEach(c => {
        fixCmds.push(`echo "\\n--- Fixing ${c} ---"`);
        // First undo any bad sed from before, then apply correct fix
        fixCmds.push(`docker exec ${c} sed -i "s/photo.respond_to?(:photo) && try(:photo).try(:attached?)/photo.photo.attached?/g" app/controllers/operations_controller.rb 2>/dev/null || true`);
        fixCmds.push(`docker exec ${c} sed -i "s/respond_to?(:photo) && try(:photo).try(:attached?)/photo.photo.attached?/g" app/controllers/operations_controller.rb 2>/dev/null || true`);
        fixCmds.push(`docker exec ${c} sed -i "s/photo.photo.attached? ? url_for(photo) :/photo.photo.attached? ? url_for(photo.photo) :/g" app/controllers/operations_controller.rb 2>/dev/null || true`);
        fixCmds.push(`docker restart ${c}`);
    });
    
    conn.exec(fixCmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('\nAll containers patched and restarted.');
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
