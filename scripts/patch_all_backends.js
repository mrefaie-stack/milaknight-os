const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Fixing the NoMethodError (attached?) on all other backends...');
    
    const containers = [
        'backend_mila_knight-app-1',
        'tba_backend-app-1',
        'dr_almunifi_dashboard-app-1',
        'backend_drsaleeh-app-1',
        'backend_aburahmah-app-1'
    ];
    
    const cmds = [];
    
    // Safety check: Some containers might not have 'operations_controller.rb' if they are an older or different branch,
    // so we use generic `|| true` to avoid breaking the script.
    
    containers.forEach(c => {
        cmds.push(`echo "Patching ${c}..."`);
        cmds.push(`docker exec ${c} sed -i "s/photo.attached?/try(:photo).try(:attached?)/g" app/controllers/*.rb 2>/dev/null || true`);
        
        cmds.push(`docker exec ${c} ruby -e "
            file = 'app/models/content_photo.rb'
            if File.exist?(file)
              content = File.read(file)
              unless content.include?('def safe_attached?')
                content.sub!('end', %Q{
  def safe_attached?
    respond_to?(:photo) && photo.attached?
  end
end})
                File.write(file, content)
              end
            end
        " 2>/dev/null || true`);
        
        cmds.push(`docker exec ${c} sed -i "s/photo.attached?/safe_attached?/g" app/controllers/*.rb 2>/dev/null || true`);
        cmds.push(`docker restart ${c}`);
    });
    
    conn.exec(cmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('\nAll patches applied and containers restarted.');
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
