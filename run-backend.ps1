# =========================================
# Backend - Execute este arquivo PRIMEIRO
# =========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  [1] BACKEND PORT 3001" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host ""
    Write-Host "ERRO: Falta arquivo .env.local" -ForegroundColor Red
    Write-Host ""
    Write-Host "Siga os passos:" -ForegroundColor Yellow
    Write-Host "1. Copie .env.example para .env.local" -ForegroundColor Yellow
    Write-Host "2. Edite .env.local com suas credenciais Supabase" -ForegroundColor Yellow
    Write-Host "3. Execute este arquivo novamente" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "[OK] .env.local encontrado" -ForegroundColor Green
Write-Host ""

# Instalar deps se necessário
if (-not (Test-Path "node_modules")) {
    Write-Host "[1/4] Instalando dependências..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Gerar Prisma
Write-Host "[2/4] Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao gerar Prisma Client" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}
Write-Host ""

# Sincronizar BD
Write-Host "[3/4] Sincronizando banco de dados..." -ForegroundColor Yellow
npx prisma db push --skip-generate
Write-Host ""

# Iniciar Backend
Write-Host "[4/4] Iniciando Backend" -ForegroundColor Green
Write-Host "🚀 Acesse: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mantenha este terminal aberto" -ForegroundColor Yellow
Write-Host "Pressione CTRL+C para parar" -ForegroundColor Yellow
Write-Host ""

npm run server
