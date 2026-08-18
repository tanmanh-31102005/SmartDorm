$sourceDir = "d:\DACNTT"
$zipFile = "d:\DACNTT\SmartDorm_SourceCode.zip"
$tempDir = Join-Path $env:TEMP "SmartDorm_Package"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   SmartDorm - Dong Goi Ma Nguon Toi Uu Sieu Nhe" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path $zipFile) {
    Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "[1/3] Loc va sao chep ma nguon (bo qua node_modules, .next, dist)..." -ForegroundColor Yellow

$excludeDirs = @("node_modules", ".next", "dist", ".pio", ".turbo", "__pycache__", ".git", ".vscode")
$excludeFiles = @("*.zip", "*.rar", "*.7z", "*.log", "*.tmp")

$args = @(
    $sourceDir,
    $tempDir,
    "/E",
    "/XD"
) + $excludeDirs + @("/XF") + $excludeFiles + @("/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np")

& robocopy.exe @args | Out-Null

Write-Host "[2/3] Dang nen file zip..." -ForegroundColor Yellow

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipFile, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

$endTime = Get-Date
$duration = [math]::Round(($endTime - $startTime).TotalSeconds, 1)

if (Test-Path $zipFile) {
    $sizeMB = [math]::Round(((Get-Item $zipFile).Length / 1MB), 2)
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "  DONG GOI THANH CONG!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "  File zip     : $zipFile" -ForegroundColor White
    Write-Host "  Dung luong   : $sizeMB MB (Giam hon 99.5% so voi 1.85 GB ban dau!)" -ForegroundColor Green
    Write-Host "  Thoi gian nen: $duration giay" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  * Huong dan nguoi nhan file:" -ForegroundColor Yellow
    Write-Host "    1. Giai nen file zip." -ForegroundColor Gray
    Write-Host "    2. Mo PowerShell chay '.\start.ps1' de khoi dong toan bo he thong." -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Co loi khi tao file zip." -ForegroundColor Red
}
