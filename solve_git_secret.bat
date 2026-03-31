@echo off
echo =======================================================
echo        FIXING ALL GITHUB SECRETS REJECTION ISSUES
echo =======================================================
echo.
echo [*] Staging all scrubbed scripts in the directory...
git add scripts/add_*_env.js
git add scripts/update_*_env.js
git add scripts/add_gads_token.js
git add scripts/add_salla_webhook.js

echo.
echo [*] Overwriting the last commit to remove all secret history...
git commit --amend --no-edit

echo.
echo [*] Forcing the push to GitHub...
git push

echo.
echo =======================================================
echo ALL DONE! Press any key to close this window.
pause
