const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Inspecting ContentPhoto id:3 and controller code...');
    
    const cmds = [
        // 1. Check the exact controller file content again with line numbers
        'docker exec backend_elsaigh-app-1 cat -n app/controllers/operations_controller.rb | sed -n "60,80p"',
        
        // 2. Run a rails runner to inspect the object and its methods
        'docker exec backend_elsaigh-app-1 bundle exec rails runner "p = ContentPhoto.find(3); puts \'Class: #{p.class}\'; puts \'Has photo method: #{p.respond_to?(:photo)}\'; puts \'Photo class: #{p.photo.class}\'; puts \'Photo responds to attached?: #{p.photo.respond_to?(:attached?)}\'"',
        
        // 3. Search for all occurrences of .attached? to see if I missed any
        'docker exec backend_elsaigh-app-1 grep -r "\\.attached?" app/controllers/'
    ];
    
    conn.exec(cmds.join(' && echo "\n--- NEXT ---\n" && '), (err, stream) => {
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
