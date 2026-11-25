param(
    [switch]$WithSimulator = $false
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Smart Dormitory - He thong KTX Thong Minh" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot
if (-not $root -or -not (Test-Path $root)) {
    $root = (Get-Location).Path
}

# 1. Kiem tra phan mem tien quyet (Node.js & npm)
if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[!] KHONG TIM THAY NODE.JS HOAC NPM!" -ForegroundColor Red
    Write-Host "    Vui long cai dat Node.js (v18 hoac v20 LTS) tu: https://nodejs.org" -ForegroundColor Yellow
    Write-Host "    Sau khi cai dat xong, vui long mo lai PowerShell va chay lai .\start.ps1" -ForegroundColor Yellow
    Read-Host "Nhan Enter de thoat..."
    exit
}

# 2. Kiem tra Python
Write-Host "[*] Kiem tra trinh thong dich Python..." -ForegroundColor Gray
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
}

if (-not $pythonCmd) {
    Write-Host "[!] CANH BAO: Khong tim thay Python trong PATH!" -ForegroundColor Red
    Write-Host "    Vui long cai dat Python 3.10+ tu https://www.python.org va tick 'Add python.exe to PATH'." -ForegroundColor Yellow
    Write-Host "    (Backend va Frontend van se hoat dong, nhung ML Service va Simulator se can Python de chay)" -ForegroundColor Yellow
} else {
    Write-Host "  -> Tim thay Python: $pythonCmd ($(& $pythonCmd --version 2>&1))" -ForegroundColor Green
    
    # Kiem tra thu vien Python can thiet
    $pyCheck = & $pythonCmd -c "import fastapi, uvicorn, paho.mqtt, sklearn, joblib, pandas; print('OK')" 2>$null
    if ($pyCheck -ne "OK") {
        Write-Host "[*] Phat hien thieu thu vien Python cho ML Service / Simulator. Dang tu dong pip install..." -ForegroundColor Yellow
        & $pythonCmd -m pip install --upgrade pip --quiet
        & $pythonCmd -m pip install -r "$root\ml-service\requirements.txt"
        & $pythonCmd -m pip install -r "$root\simulator\requirements.txt"
    } else {
        Write-Host "  -> Thu vien Python: Day du san sang." -ForegroundColor Green
    }
}

# 3. Kiem tra va khoi phuc cac file cau hinh .env neu thieu
if (-not (Test-Path "$root\backend\.env")) {
    if (Test-Path "$root\backend\.env.example") {
        Write-Host "[*] Khoi phuc backend\.env tu template mau..." -ForegroundColor Yellow
        Copy-Item "$root\backend\.env.example" "$root\backend\.env"
    }
}

if (-not (Test-Path "$root\frontend\.env.local")) {
    if (Test-Path "$root\frontend\.env.example") {
        Write-Host "[*] Khoi phuc frontend\.env.local tu template mau..." -ForegroundColor Yellow
        Copy-Item "$root\frontend\.env.example" "$root\frontend\.env.local"
    }
}

if (-not (Test-Path "$root\ml-service\.env")) {
    if (Test-Path "$root\ml-service\.env.example") {
        Write-Host "[*] Khoi phuc ml-service\.env tu template mau..." -ForegroundColor Yellow
        Copy-Item "$root\ml-service\.env.example" "$root\ml-service\.env"
    }
}

# 4. Kiem tra Backend node_modules & Database
if (-not (Test-Path "$root\backend\node_modules")) {
    Write-Host "[*] Phat hien Backend chua co node_modules. Dang cai dat dependencies..." -ForegroundColor Yellow
    Set-Location "$root\backend"
    npm install
}

if (-not (Test-Path "$root\backend\prisma\dev.db")) {
    Write-Host "[*] Khoi tao co so du lieu SQLite (dev.db) va tao du lieu mau..." -ForegroundColor Yellow
    Set-Location "$root\backend"
    npx prisma generate
    npx prisma db push
    npx ts-node prisma/seed.ts
}

# 5. Kiem tra Frontend node_modules
if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "[*] Phat hien Frontend chua co node_modules. Dang cai dat dependencies..." -ForegroundColor Yellow
    Set-Location "$root\frontend"
    npm install
}

Set-Location $root

# 6. Giai phong port 3001 (Backend), 3000 (Frontend), 8000 (ML Service) neu dang bi chiem
Write-Host "[0/4] Kiem tra va giai phong port 3001, 3000 & 8000 neu dang bi chiem..." -ForegroundColor Gray
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
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; Write-Host '=== BACKEND SERVER (NestJS - Port 3001) ===' -ForegroundColor Green; npm run start:dev"

Start-Sleep -Seconds 3

# Terminal 2: ML Python Service (FastAPI)
if ($pythonCmd) {
    Write-Host "[2/4] Khoi dong ML Intelligence Service (port 8000)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ml-service'; Write-Host '=== ML SERVICE (FastAPI - Port 8000) ===' -ForegroundColor Green; $pythonCmd -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    Start-Sleep -Seconds 2
}

# Terminal 3: Frontend Next.js
Write-Host "[3/4] Khoi dong Frontend Next.js (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; Write-Host '=== FRONTEND SERVER (Next.js - Port 3000) ===' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

# Terminal 4: Python Simulator (Mac dinh TAT khi Demo phan cung that de tranh gay nhiễu và khóa SQLite)
if ($WithSimulator -and $pythonCmd) {
    Write-Host "[4/4] Khoi dong Python MQTT Simulator (Phong ao 102 - 118)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\simulator'; Write-Host '=== MQTT ROOM SIMULATOR ===' -ForegroundColor Green; $pythonCmd simulate_rooms.py"
} else {
    Write-Host "[4/4] Python Simulator: DA TAT (Che do Demo Mach That Phong 101 - Khong dung do phong ao)" -ForegroundColor Cyan
    Write-Host "      (De mo phong ca phong ao 102-118, chay: .\start.ps1 -WithSimulator)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  He thong SmartDorm AI da khoi dong hoan tat!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Web Dashboard: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API  : http://localhost:3001" -ForegroundColor White
Write-Host "  Swagger Docs : http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "  ML API Docs  : http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Tai khoan dang nhap:" -ForegroundColor Cyan
Write-Host "  - Quan tri vien (Admin) : admin@ktx.edu.vn  /  admin123" -ForegroundColor White
Write-Host "  - Sinh vien (Student)  : sv001@student.edu.vn  /  sinhvien123" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Green
