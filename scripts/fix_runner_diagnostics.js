const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Running corrected rails runner...');
    
    // Using double quotes for the runner command and single quotes inside for strings to avoid shell interpolation issues
    const runnerCmd = `
        p = ContentPhoto.find(3)
        puts "Class: #{p.class}"
        puts "Has photo method: #{p.respond_to?(:photo)}"
        puts "Photo class: #{p.photo.class}"
        puts "Photo responds to attached?: #{p.photo.respond_to?(:attached?)}"
        puts "Columns: #{ContentPhoto.column_names.join(', ')}"
    `;
    
    const cmds = [
        `docker exec backend_elsaigh-app-1 bundle exec rails runner '${runnerCmd}'`
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
