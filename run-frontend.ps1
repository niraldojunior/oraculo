# ======================================
# Frontend - Execute DEPOIS do Backend
# ======================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  [2] FRONTEND PORT 5173" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Certifique-se de que run-backend.ps1 ja esta rodando!" -ForegroundColor Yellow
Write-Host ""
Read-Host "Pressione ENTER para continuar"

Write-Host ""
Write-Host "[OK] Iniciando Frontend" -ForegroundColor Green
Write-Host "🚀 Acesse: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mantenha este terminal aberto" -ForegroundColor Yellow
Write-Host "Pressione CTRL+C para parar" -ForegroundColor Yellow
Write-Host ""

npm run dev
