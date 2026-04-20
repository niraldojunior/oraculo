@echo off
REM Script simples para rodar Frontend + Backend (Windows CMD)
REM Execução: start-dev.bat

echo ========================================
echo   Iniciando Oraculo (Frontend + Backend)
echo ========================================
echo.

REM Verificar se .env.local existe
if not exist ".env.local" (
    echo.
    echo ERRO: Arquivo .env.local nao encontrado!
    echo.
    echo 1. Crie um arquivo .env.local na raiz do projeto
    echo 2. Use .env.example como referencia
    echo 3. Adicione suas credenciais do Supabase:
    echo.
    echo    DATABASE_URL="postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres"
    echo    DIRECT_URL="postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres"
    echo.
    pause
    exit /b 1
)

echo [OK] Arquivo .env.local encontrado
echo.

REM Passo 1: Instalar dependencias
echo [1/4] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando npm packages...
    call npm install
    if errorlevel 1 (
        echo Erro ao instalar dependencias
        pause
        exit /b 1
    )
) else (
    echo [OK] node_modules ja existe
)
echo.

REM Passo 2: Gerar Prisma Client
echo [2/4] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo Erro ao gerar Prisma Client
    pause
    exit /b 1
)
echo [OK] Prisma Client gerado
echo.

REM Passo 3: Sincronizar banco de dados (skip - schema managed manually via Supabase)
REM call npx prisma db push --skip-generate

REM Passo 4: Iniciar Backend e Frontend
echo [4/4] Iniciando aplicacao...
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo [!] Abrindo 2 novas janelas (Backend e Frontend)
echo [!] Feche-as para parar a aplicacao
echo.

REM Abrir Backend em nova janela
start "Backend API" cmd /k "npm run server"

REM Aguardar um pouco
timeout /t 2 /nobreak

REM Abrir Frontend em nova janela
start "Frontend App" cmd /k "npm run dev"

echo.
echo [OK] Aplicacao iniciada!
echo.
pause
