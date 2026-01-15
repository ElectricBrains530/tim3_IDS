@echo off
cd /d "c:\Dev\MakerKit\apps\web"
call npx tsx scripts/verify-tenancy.ts
pause
