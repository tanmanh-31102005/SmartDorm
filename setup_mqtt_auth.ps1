# ============================================================
# SmartDorm — Script Thiết Lập MQTT Authentication
# Dùng khi triển khai production thật sự
# ============================================================
# Chạy: .\setup_mqtt_auth.ps1

Write-Host "=== SmartDorm MQTT Authentication Setup ===" -ForegroundColor Cyan

# Kiểm tra mosquitto_passwd có trong PATH
$mqttPasswd = Get-Command "mosquitto_passwd" -ErrorAction SilentlyContinue
if (-not $mqttPasswd) {
    Write-Host "[INFO] mosquitto_passwd không tìm thấy. Dùng Docker để tạo file..." -ForegroundColor Yellow
    
    # Tạo password file bên trong Docker container
    Write-Host ""
    Write-Host "Nhập password cho user 'smartdorm_backend' (kết nối từ NestJS):"
    $backendPass = Read-Host -AsSecureString
    $backendPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($backendPass))
    
    Write-Host "Nhập password cho user 'smartdorm_esp32' (kết nối từ phần cứng):"
    $esp32Pass = Read-Host -AsSecureString
    $esp32PassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($esp32Pass))
    
    # Tạo file tạm
    $tempConf = "listener 1883`nallow_anonymous true"
    $tempConf | Out-File -FilePath "mosquitto_temp.conf" -Encoding ASCII
    
    # Dùng Docker để tạo passwd file
    docker run --rm `
        -v "${PWD}/mosquitto_passwd:/mosquitto/config/passwd" `
        eclipse-mosquitto:2.0 `
        sh -c "mosquitto_passwd -b -c /mosquitto/config/passwd smartdorm_backend '$backendPassPlain' && mosquitto_passwd -b /mosquitto/config/passwd smartdorm_esp32 '$esp32PassPlain'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] File mosquitto_passwd đã được tạo!" -ForegroundColor Green
    }
    
    Remove-Item "mosquitto_temp.conf" -ErrorAction SilentlyContinue
} else {
    Write-Host "Nhập password cho user 'smartdorm_backend':"
    $backendPass = Read-Host -AsSecureString
    $backendPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($backendPass))
    
    mosquitto_passwd -b -c mosquitto_passwd smartdorm_backend $backendPassPlain
    
    Write-Host "Nhập password cho user 'smartdorm_esp32':"
    $esp32Pass = Read-Host -AsSecureString
    $esp32PassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($esp32Pass))
    
    mosquitto_passwd -b mosquitto_passwd smartdorm_esp32 $esp32PassPlain
    Write-Host "[OK] File mosquitto_passwd đã được tạo!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== BƯỚC TIẾP THEO ===" -ForegroundColor Yellow
Write-Host "1. Mở mosquitto.conf"
Write-Host "2. Đổi 'allow_anonymous true' thành 'allow_anonymous false'"
Write-Host "3. Bỏ comment dòng '# password_file /mosquitto/config/passwd'"
Write-Host "4. Cập nhật MQTT_USER/MQTT_PASS trong ESP32 firmware (main.cpp)"
Write-Host "5. Chạy lại: docker compose restart mosquitto"
Write-Host ""
Write-Host "Credentials cho ESP32 firmware:" -ForegroundColor Cyan
Write-Host "  const char* MQTT_USER = `"smartdorm_esp32`";"
Write-Host "  const char* MQTT_PASS = `"<password bạn vừa nhập>`";"
