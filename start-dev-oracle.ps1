# Start development environment with Oracle provider
# Usage: .\start-dev-oracle.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host 'Starting development environment (Oracle)...' -ForegroundColor Cyan

if (-not (Test-Path '.env.local')) {
    Write-Host 'ERROR: .env.local not found in project root.' -ForegroundColor Red
    exit 1
}

# Load .env.local into current process for this script execution
Get-Content '.env.local' | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { return }

    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()

    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
    }

    Set-Item -Path ("Env:{0}" -f $key) -Value $value
}

$requiredOracleVars = @('ORACLE_USER', 'ORACLE_PASSWORD', 'ORACLE_CONNECTION_STRING')
$missing = @()
foreach ($name in $requiredOracleVars) {
    if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
        $missing += $name
    }
}

if ($missing.Count -gt 0) {
    Write-Host 'ERROR: Missing Oracle environment variables:' -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "- $_" -ForegroundColor Yellow }
    Write-Host 'Set them in your terminal, user profile, machine env, or .env.local.' -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing dependencies...' -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host 'Generating Prisma client...' -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$backendCommand = "Set-Location '$root'; `$env:DB_PROVIDER='oracle'; npm run server"
$frontendCommand = "Set-Location '$root'; npm run dev"

Write-Host 'Opening backend window (Oracle)...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand

Start-Sleep -Seconds 2

Write-Host 'Opening frontend window...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand

Write-Host 'Done. Backend: http://localhost:3001 | Frontend: http://localhost:5173' -ForegroundColor Cyan
