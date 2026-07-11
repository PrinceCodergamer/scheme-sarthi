Write-Host "🚀 Starting Scheme Sarthi..." -ForegroundColor Green

$BackendDir = Join-Path $PSScriptRoot "backend"
$FrontendDir = Join-Path $PSScriptRoot "frontend"

# Check if DB exists, seed if needed
$DbPath = Join-Path $BackendDir "scheme_sarthi.db"
if (-not (Test-Path $DbPath)) {
    Write-Host "📦 Seeding database..." -ForegroundColor Yellow
    Push-Location $BackendDir
    python -c "from database import init_db, seed_schemes; init_db(); seed_schemes(); print('DB seeded!')"
    Pop-Location
}

# Start backend
Write-Host "🔧 Starting backend on http://localhost:8000..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    uvicorn main:app --reload --port 8000
} -ArgumentList $BackendDir

# Start frontend
Write-Host "🎨 Starting frontend on http://localhost:5173..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $FrontendDir

Write-Host ""
Write-Host "✅ Scheme Sarthi is running!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Gray

try {
    while ($true) {
        Start-Sleep -Seconds 1
        # Check if jobs are still running
        $b = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        $f = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        if ($b -or $f) {
            Write-Host $b -ForegroundColor Red
            Write-Host $f -ForegroundColor Red
        }
    }
} finally {
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
}
