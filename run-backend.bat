@REM =========================================
@REM Backend - Execute este arquivo PRIMEIRO
@REM =========================================
@echo off
cls
echo.
echo ========================================
echo  [1] BACKEND PORT 3001
echo ========================================
echo.

REM Verificar .env.local
if not exist ".env.local" (
    echo.
    echo ERRO: Falta arquivo .env.local
    echo.
    echo Siga os passos:
    echo 1. Copie .env.example para .env.local
    echo 2. Edite .env.local com suas credenciais Supabase
    echo 3. Execute este arquivo novamente
    echo.
    pause
    exit /b 1
)

echo [OK] .env.local encontrado
echo.

REM Gerar Prisma
echo [1/3] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERRO ao gerar Prisma Client
    pause
    exit /b 1
)
echo.

REM Sincronizar BD (skip - schema managed manually via Supabase)
REM call npx prisma db push --skip-generate

REM Iniciar Backend
echo [3/3] Iniciando Backend em http://localhost:3001
echo.
echo Mantenha este terminal aberto
echo Pressione CTRL+C para parar
echo.

call npm run server

pause
