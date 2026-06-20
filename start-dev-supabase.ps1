# Start development environment with Supabase provider
# Usage: .\start-dev-supabase.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host 'Starting development environment (Supabase)...' -ForegroundColor Cyan

if (-not (Test-Path '.env.local')) {
    Write-Host 'ERROR: .env.local not found in project root.' -ForegroundColor Red
    exit 1
}

$requiredSupabaseVars = @('DATABASE_URL', 'DIRECT_URL')
$missing = @()
foreach ($name in $requiredSupabaseVars) {
    if (-not [Environment]::GetEnvironmentVariable($name, 'Process') -and -not [Environment]::GetEnvironmentVariable($name, 'User') -and -not [Environment]::GetEnvironmentVariable($name, 'Machine')) {
        $missing += $name
    }
}

if ($missing.Count -gt 0) {
    Write-Host 'WARNING: Missing Supabase environment variables in OS env:' -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "- $_" -ForegroundColor Yellow }
    Write-Host 'If they are only in .env.local, backend should still load them via dotenv.' -ForegroundColor Yellow
}

if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing dependencies...' -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host 'Generating Prisma client...' -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$backendCommand = "Set-Location '$root'; `$env:DB_PROVIDER='supabase'; npm run server"
$frontendCommand = "Set-Location '$root'; npm run dev"

Write-Host 'Opening backend window (Supabase)...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand

Start-Sleep -Seconds 2

Write-Host 'Opening frontend window...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand

Write-Host 'Done. Backend: http://localhost:3001 | Frontend: http://localhost:5173' -ForegroundColor Cyan
