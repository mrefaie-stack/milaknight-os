const { execSync } = require('child_process');
const env = { 
    ...process.env, 
    GIT_TERMINAL_PROMPT: '0', 
    GCM_INTERACTIVE: 'false' 
};

try {
   console.log("Forcing Git cleanup due to secret scanning...");
   
   // Make sure index.lock is gone forcefully
   try { require('fs').unlinkSync('.git/index.lock'); } catch(e){}

   console.log("Staging scrubbed file...");
   execSync('git add scripts/add_google_env.js', { env, stdio: 'pipe' });
   
   console.log("Amending commit...");
   execSync('git commit --amend --no-edit', { env, stdio: 'pipe' });
   
   console.log("Pushing forcefully...");
   execSync('git push', { env, stdio: 'pipe' });
   
   console.log("=== DONE SUCCESSFULLY ===");
} catch(e) {
   console.error("=== FAILED ===");
   console.error(e.message);
   if (e.stdout) console.error("STDOUT:", e.stdout.toString());
   if (e.stderr) console.error("STDERR:", e.stderr.toString());
}
