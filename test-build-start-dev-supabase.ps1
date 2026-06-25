# Start development environment with Supabase provider
# Usage: .\start-dev-supabase.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host 'Starting development environment (Supabase) with pre-flight checks...' -ForegroundColor Cyan

function Stop-ProcessesOnPorts([int[]]$Ports) {
    $allPids = @()

    foreach ($port in $Ports) {
        $lines = netstat -ano | findstr LISTENING | findstr (":$port")
        if (-not $lines) { continue }

        $lines | ForEach-Object {
            $parts = ($_ -split '\s+') | Where-Object { $_ -ne '' }
            if ($parts.Length -gt 0) {
                $allPids += $parts[-1]
            }
        }
    }

    $allPids = $allPids | Sort-Object -Unique
    foreach ($pidText in $allPids) {
        [int]$targetPid = 0
        if (-not [int]::TryParse($pidText, [ref]$targetPid)) { continue }

        if ($targetPid -le 0) { continue }

        try {
            Stop-Process -Id $targetPid -Force -ErrorAction Stop
            Write-Host ("Stopped PID {0} using target startup ports" -f $targetPid) -ForegroundColor Yellow
        }
        catch {
            # Ignore processes that are already closed or inaccessible.
        }
    }
}

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

Write-Host 'Cleaning existing listeners on ports 3001 and 5173...' -ForegroundColor Cyan
Stop-ProcessesOnPorts -Ports @(3001, 5173)
Start-Sleep -Seconds 1

if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing dependencies...' -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Release potential Prisma engine locks from prior node processes.
Write-Host 'Releasing local Node locks before Prisma generate...' -ForegroundColor Cyan
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host 'Generating Prisma client...' -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Prisma generate failed. Retrying after resetting Prisma local engine cache...' -ForegroundColor Yellow

    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    $prismaClientDir = Join-Path $root 'node_modules\.prisma\client'
    if (Test-Path $prismaClientDir) {
        Remove-Item (Join-Path $prismaClientDir 'query_engine-windows.dll.node.tmp*') -Force -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $prismaClientDir 'query_engine-windows.dll.node') -Force -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $prismaClientDir 'libquery_engine-windows*') -Force -ErrorAction SilentlyContinue
    }

    Remove-Item (Join-Path $root 'node_modules\@prisma\client') -Recurse -Force -ErrorAction SilentlyContinue
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'ERROR: Prisma client generation failed after retry (possible DLL lock still active).' -ForegroundColor Red
        Write-Host 'Close all Node.js terminals/processes on Windows and run .\start-dev-supabase.ps1 again.' -ForegroundColor Yellow
        exit $LASTEXITCODE
    }
}

# Passo 0: Teste e Build
Write-Host "[Test] Executando testes..." -ForegroundColor Cyan
npm run api:test -- --coverage
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Erro] Falha nos testes! Corrija os erros antes de iniciar." -ForegroundColor Red
    exit 1
}

Write-Host "[Build] Executando build (Frontend e Backend)..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Erro] Falha no build! Corrija os erros antes de iniciar." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Testes e build concluidos com sucesso" -ForegroundColor Green
Write-Host ""

$backendCommand = "Set-Location '$root'; `$env:DB_PROVIDER='supabase'; npm run server"
$frontendCommand = "Set-Location '$root'; npm run dev"

Write-Host 'Opening backend window (Supabase)...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand

Start-Sleep -Seconds 2

Write-Host 'Opening frontend window...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand

Write-Host 'Done. Backend: http://localhost:3001 | Frontend: http://localhost:5173' -ForegroundColor Cyan
