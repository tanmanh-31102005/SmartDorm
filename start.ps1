Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Smart Dormitory - He thong KTX Thong Minh" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot
if (-not $root) { $root = "d:\DACNTT2\SmartDorm_SourceCode" }

# 0. Kiem tra dependencies neu moi giai nen tu zip
if (-not (Test-Path "$root\backend\node_modules")) {
    Write-Host "[*] Phat hien Backend chua co node_modules. Dang tu dong cai dat..." -ForegroundColor Yellow
    Set-Location "$root\backend"
    npm install
    npx prisma db push
    npx ts-node prisma/seed.ts
}

if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "[*] Phat hien Frontend chua co node_modules. Dang tu dong cai dat..." -ForegroundColor Yellow
    Set-Location "$root\frontend"
    npm install
}

Set-Location $root

# Giai phong cong 3001 (Backend), 3000 (Frontend), 8000 (ML Service) neu dang bi chiem
Write-Host "[0/4] Kiem tra va giai phong port 3001, 3000 & 8000..." -ForegroundColor Gray
$ports = @(3001, 3000, 8000)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $conns) {
        if ($p -and $p -ne 0) {
            Write-Host "  -> Dang dong tien trinh cu tren port $port (PID: $p)..." -ForegroundColor DarkYellow
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Seconds 1

# Terminal 1: Backend NestJS
Write-Host "[1/4] Khoi dong Backend NestJS (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; Write-Host 'BACKEND SERVER (NestJS)' -ForegroundColor Green; npm run start:dev"

Start-Sleep -Seconds 3

# Terminal 2: ML Python Service (FastAPI)
Write-Host "[2/4] Khoi dong ML Intelligence Service (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ml-service'; Write-Host 'ML SERVICE (FastAPI)' -ForegroundColor Green; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 2

# Terminal 3: Frontend Next.js
Write-Host "[3/4] Khoi dong Frontend Next.js (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; Write-Host 'FRONTEND SERVER (Next.js)' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

# Terminal 4: Python Simulator
Write-Host "[4/4] Khoi dong Python MQTT Simulator..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\simulator'; Write-Host 'MQTT SIMULATOR' -ForegroundColor Green; python simulate_rooms.py"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  He thong SmartDorm AI dang khoi dong hoan tat!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend      : http://localhost:3001" -ForegroundColor White
Write-Host "  Swagger      : http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "  ML Service   : http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Dashboard    : http://localhost:3000" -ForegroundColor White
Write-Host "  Intelligence : http://localhost:3000/dashboard/intelligence" -ForegroundColor White
Write-Host ""
Write-Host "  Admin        : admin@ktx.edu.vn / admin123" -ForegroundColor Cyan
Write-Host "  SinhVien     : sv001@student.edu.vn / sinhvien123" -ForegroundColor Cyan
Write-Host ""

