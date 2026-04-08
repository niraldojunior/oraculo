@REM ======================================
@REM Frontend - Execute DEPOIS do Backend
@REM ======================================
@echo off
cls
echo.
echo ========================================
echo  [2] FRONTEND PORT 5173
echo ========================================
echo.
echo Certifique-se de que run-backend.bat ja esta rodando!
echo.
pause

echo [OK] Iniciando Frontend em http://localhost:5173
echo.
echo Mantenha este terminal aberto
echo Pressione CTRL+C para parar
echo.

call npm run dev

pause
