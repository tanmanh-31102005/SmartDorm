# ================================================================
#  SmartDorm - Script Dong Goi Du An Toi Uu Sieu Nhe (Zip)
#  Tu dong loai bo node_modules, .next, cache, logs giam tu 4GB xuong ~10MB
# ================================================================

param(
    [string]$OutputPath = ""
)

$sourceDir = $PSScriptRoot
if (-not $sourceDir -or -not (Test-Path $sourceDir)) {
    $sourceDir = (Get-Location).Path
}

$parentDir = Split-Path -Path $sourceDir -Parent
if (-not $OutputPath) {
    $zipFile = Join-Path $parentDir "SmartDorm_SourceCode_Nhe.zip"
} else {
    $zipFile = $OutputPath
}

$tempDir = Join-Path $env:TEMP "SmartDorm_Package_$([System.Guid]::NewGuid().ToString('N').Substring(0,8))"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   SmartDorm - Dong Goi Ma Nguon Toi Uu Sieu Nhe" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Thu muc nguon : $sourceDir" -ForegroundColor Gray
Write-Host "  Dich file zip : $zipFile" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date

# Tinh dung luong thu muc hien tai
Write-Host "[1/3] Dang kiem tra dung luong goc..." -ForegroundColor Yellow
try {
    $fso = New-Object -ComObject Scripting.FileSystemObject
    $origFolder = $fso.GetFolder($sourceDir)
    $origMB = [math]::Round($origFolder.Size / 1MB, 2)
    Write-Host "  -> Dung luong hien tai truoc khi loc: $origMB MB (~$([math]::Round($origMB/1024, 2)) GB)" -ForegroundColor DarkYellow
} catch {
    $origMB = 0
}

# Don dep temp cu
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path $zipFile) {
    Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "[2/3] Loc va sao chep ma nguon sach (bo qua latex_source, node_modules, .next, .pio, cache)..." -ForegroundColor Yellow

$excludeDirs = @(
    "node_modules", 
    ".next", 
    "dist", 
    ".pio", 
    ".turbo", 
    "__pycache__", 
    ".pytest_cache", 
    ".git", 
    ".vscode", 
    ".idea",
    ".venv",
    "venv",
    "env",
    "coverage", 
    "backups",
    "latex_source"
)

$excludeFiles = @(
    "*.zip", 
    "*.rar", 
    "*.7z", 
    "*.tar.gz", 
    "*.log", 
    "*.tmp", 
    "*.tsbuildinfo"
)

$robocopyArgs = @(
    $sourceDir,
    $tempDir,
    "/E",
    "/XD"
) + $excludeDirs + @("/XF") + $excludeFiles + @("/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np")

& robocopy.exe @robocopyArgs | Out-Null

Write-Host "[3/3] Dang tien hanh nen thanh file zip..." -ForegroundColor Yellow

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipFile, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# Xoa thu muc tam
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

$endTime = Get-Date
$duration = [math]::Round(($endTime - $startTime).TotalSeconds, 1)

if (Test-Path $zipFile) {
    $zipItem = Get-Item $zipFile
    $sizeMB = [math]::Round(($zipItem.Length / 1MB), 2)
    $ratio = if ($origMB -gt 0) { [math]::Round((1 - ($sizeMB / $origMB)) * 100, 1) } else { 99 }

    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "  DONG GOI THANH CONG XUAT SAC!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "  File zip da tao : $zipFile" -ForegroundColor White
    Write-Host "  Dung luong sau nén: $sizeMB MB (Giam $ratio% so voi $origMB MB goc!)" -ForegroundColor Green
    Write-Host "  Thoi gian xu ly : $duration giay" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  * Huong dan cho nguoi nhan file tren may khac:" -ForegroundColor Yellow
    Write-Host "    1. Giai nen file '$([System.IO.Path]::GetFileName($zipFile))'." -ForegroundColor Gray
    Write-Host "    2. Mo PowerShell tai thu muc vua giai nen." -ForegroundColor Gray
    Write-Host "    3. Chay lenh: .\start.ps1" -ForegroundColor Gray
    Write-Host "       (He thong se tu dong npm install, setup Database va khoi dong ca 4 service!)" -ForegroundColor Gray
    Write-Host "==================================================" -ForegroundColor Green
} else {
    Write-Host "Co loi khi tao file zip!" -ForegroundColor Red
}
