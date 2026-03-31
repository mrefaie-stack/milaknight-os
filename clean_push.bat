@echo off
echo =======================================================
echo          ULTIMATE GITHUB FIX (RESET AND PUSH)
echo =======================================================
echo.
echo [*] 1. Resetting stuck local commits to match GitHub...
git reset --soft origin/main

echo.
echo [*] 2. Adding all modified safe files...
git add .

echo.
echo [*] 3. Creating one fresh, clean commit...
git commit -m "Deploy updates and fix AI errors"

echo.
echo [*] 4. Pushing to GitHub...
git push

echo.
echo =======================================================
echo ALL DONE! Press any key to exit.
pause
