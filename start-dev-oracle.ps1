# Start development environment with Oracle provider
# Usage: .\start-dev-oracle.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host 'Starting development environment (Oracle)...' -ForegroundColor Cyan

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

Write-Host 'Cleaning existing listeners on ports 3001 and 5173...' -ForegroundColor Cyan
Stop-ProcessesOnPorts -Ports @(3001, 5173)
Start-Sleep -Seconds 1

# Validate Oracle connectivity early to avoid booting frontend/backend in broken state.
Write-Host 'Validating Oracle connectivity...' -ForegroundColor Cyan
$oracleConnectString = [Environment]::GetEnvironmentVariable('ORACLE_CONNECTION_STRING', 'Process')
if ($oracleConnectString) {
    $parts = $oracleConnectString -split '/'
    $hostPort = $parts[0]
    if ($hostPort -and $hostPort.Contains(':')) {
        $oracleHost = ($hostPort -split ':')[0]
        $portText = ($hostPort -split ':')[1]
        [int]$port = 1521
        if (-not [int]::TryParse($portText, [ref]$port)) {
            $port = 1521
        }

        $reachable = Test-NetConnection -ComputerName $oracleHost -Port $port -WarningAction SilentlyContinue
        if (-not $reachable.TcpTestSucceeded) {
            Write-Host ("ERROR: Unable to reach Oracle host {0}:{1}." -f $oracleHost, $port) -ForegroundColor Red
            Write-Host 'Check ORACLE_CONNECTION_STRING, VPN/network access, and DNS resolution.' -ForegroundColor Yellow
            exit 1
        }
    }
}

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

    # Second pass: kill any remaining node process and reset local Prisma engine artifacts.
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
        Write-Host 'Close all Node.js terminals/processes on Windows and run .\start-dev-oracle.ps1 again.' -ForegroundColor Yellow
        exit $LASTEXITCODE
    }
}

$backendCommand = "Set-Location '$root'; `$env:DB_PROVIDER='oracle'; npm run server"
$frontendCommand = "Set-Location '$root'; npm run dev"

Write-Host 'Opening backend window (Oracle)...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand

# Wait until backend is reachable to avoid transient 502 from Vite proxy.
Write-Host 'Waiting backend readiness on http://127.0.0.1:3001/api/health ...' -ForegroundColor Cyan
$maxAttempts = 30
$ready = $false
for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    try {
        $response = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            $ready = $true
            break
        }
    }
    catch {
        # Keep waiting while backend compiles/boots.
    }

    Start-Sleep -Seconds 1
}

if (-not $ready) {
    Write-Host 'WARNING: Backend did not become ready in time; opening frontend anyway.' -ForegroundColor Yellow
}

Write-Host 'Opening frontend window...' -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand

Write-Host 'Done. Backend: http://localhost:3001 | Frontend: http://localhost:5173' -ForegroundColor Cyan
