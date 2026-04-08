# Script para rodar Frontend + Backend com Supabase
# Execução: .\start-dev.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Oraculo (Frontend + Backend)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  ERRO: Arquivo .env.local não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Crie um arquivo .env.local na raiz do projeto" -ForegroundColor Yellow
    Write-Host "2. Use .env.example como referência" -ForegroundColor Yellow
    Write-Host "3. Adicione suas credenciais do Supabase:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   DATABASE_URL=`"postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres`"" -ForegroundColor Gray
    Write-Host "   DIRECT_URL=`"postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Pegue as credenciais em:" -ForegroundColor Yellow
    Write-Host "https://app.supabase.com/project/[seu-projeto]/settings/database" -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ Arquivo .env.local encontrado" -ForegroundColor Green
Write-Host ""

# Passo 1: Verificar se node_modules existe
Write-Host "📦 Verificando dependências..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando npm packages..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ node_modules já existe" -ForegroundColor Green
}

Write-Host ""

# Passo 2: Gerar Prisma Client
Write-Host "🔧 Gerando Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma Client gerado" -ForegroundColor Green
Write-Host ""

# Passo 3: Migrar banco de dados (se necessário)
Write-Host "🗄️  Verificando banco de dados..." -ForegroundColor Cyan
$databaseExists = npx prisma db push --skip-generate 2>&1 | Select-String "No changes"
if ($databaseExists) {
    Write-Host "✓ Banco de dados já está atualizado" -ForegroundColor Green
} else {
    Write-Host "✓ Banco de dados sincronizado" -ForegroundColor Green
}
Write-Host ""

# Passo 4: Iniciar Backend e Frontend em paralelo
Write-Host "🚀 Iniciando aplicação..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend rodará em: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend rodará em: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione CTRL+C para parar a aplicação" -ForegroundColor Yellow
Write-Host ""

# Iniciar Backend em background job
Write-Host "► Iniciando Backend..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    npm run server
}

# Aguardar um segundo
Start-Sleep -Seconds 2

# Iniciar Frontend em background job
Write-Host "► Iniciando Frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    npm run dev
}

Write-Host ""
Write-Host "✓ Aplicação iniciada!" -ForegroundColor Green
Write-Host ""

# Monitorar os jobs
while ($backendJob.State -eq "Running" -or $frontendJob.State -eq "Running") {
    Start-Sleep -Seconds 1
}

# Se chegou aqui, algum job terminou
Write-Host ""
Write-Host "⚠️  Um dos serviços foi encerrado" -ForegroundColor Yellow

# Limpar jobs
Get-Job | Stop-Job
Get-Job | Remove-Job
