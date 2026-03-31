const fs = require('fs');
const filesToClean = [
    'scripts/add_linkedin_env.js',
    'scripts/add_x_env.js',
    'scripts/add_salla_env.js',
    'scripts/add_salla_webhook.js',
    'scripts/add_gads_token.js',
    'scripts/update_linkedin_env.js',
    'scripts/add_google_env.js'
];

filesToClean.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            // Write a safe decoy file
            fs.writeFileSync(file, '// scrubbed for security');
            console.log('Cleaned: ' + file);
        }
    } catch(e) {
        console.error(e);
    }
});
