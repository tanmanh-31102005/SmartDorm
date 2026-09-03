# ==============================================================================
# SMARTDORM - DOCKER DISK SPACE CLEANUP UTILITY SCRIPT
# Giải phóng dung lượng ổ đĩa (Dangling images, BuildKit Cache rác, stopped containers)
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " [SmartDorm] DỌN DẸP DUNG LƯỢNG RÁC DOCKER & BUILDKIT CACHE      " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Kiểm tra dung lượng Docker đang chiếm dụng
Write-Host "`n1. Kiểm tra dung lượng Docker đang sử dụng:" -ForegroundColor Green
docker system df

# 2. Xóa các container đã dừng và networks không sử dụng
Write-Host "`n2. Dọn dẹp containers và networks rác..." -ForegroundColor Green
docker container prune -f
docker network prune -f

# 3. Xóa các dangling images (<none>:<none>)
Write-Host "`n3. Dọn dẹp các images không còn gắn tag (Dangling Images)..." -ForegroundColor Green
docker image prune -f

# 4. Xóa BuildKit Build Cache (thường chiếm 5GB - 30GB sau nhiều lần build)
Write-Host "`n4. Dọn dẹp BuildKit Cache (Giải phóng dung lượng lớn nhất)..." -ForegroundColor Green
docker builder prune -a -f

# 5. Tổng kết dung lượng sau khi dọn
Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host " TỔNG KẾT DUNG LƯỢNG SAU KHI DỌN DẸP:" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
docker system df
Write-Host "`n[Hoàn tất] Ổ đĩa của bạn đã được giải phóng thành công!" -ForegroundColor Green
