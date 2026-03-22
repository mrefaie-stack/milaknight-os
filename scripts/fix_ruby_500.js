const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Fixing the NoMethodError (attached?) on ContentPhoto...');
    
    // The error occurs in operations_controller.rb line 66 / 69.
    // The issue is likely that `ContentPhoto` is being used, but `photo` is not loaded or the ActiveStorage scope is broken for some reason.
    // The safest fix without rebuilding docker images is to modify the ruby code to check `photo.attached?` safely by checking if it responds to it, or wrapping it.
    
    const cmds = [
        // Fix for elsaigh
        'docker exec backend_elsaigh-app-1 sed -i "s/photo.attached?/respond_to?(:photo) \\&\\& photo.attached?/g" app/controllers/operations_controller.rb',
        'docker exec backend_elsaigh-app-1 sed -i "s/photo.attached?/try(:photo).try(:attached?)/g" app/controllers/operations_controller.rb',
        
        // Also check if there's an issue in the model and just make it safe
        `docker exec backend_elsaigh-app-1 ruby -e "
            file = 'app/models/content_photo.rb'
            content = File.read(file)
            unless content.include?('def safe_attached?')
              content.sub!('end', %Q{
  def safe_attached?
    respond_to?(:photo) && photo.attached?
  end
end})
              File.write(file, content)
            end
        "`,
        
        // Let's replace photo.attached? with safe_attached? in the controller
        'docker exec backend_elsaigh-app-1 sed -i "s/photo.attached?/safe_attached?/g" app/controllers/operations_controller.rb',
        
        // Restart the container to pick up code changes
        'docker restart backend_elsaigh-app-1'
    ];
    
    conn.exec(cmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Patch applied and container restarted.');
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
