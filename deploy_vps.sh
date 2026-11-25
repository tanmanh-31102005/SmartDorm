#!/usr/bin/env bash
# ==============================================================================
# SmartDorm Enterprise — 1-Click Cloud VPS Deployment Script (Ubuntu/Debian)
# ==============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}🚀 SMARTDORM CLOUD VPS — TỰ ĐỘNG TRIỂN KHAI HỆ THỐNG 1-CLICK           ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# 1. Kiểm tra quyền root
export DEBIAN_FRONTEND=noninteractive
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Vui lòng chạy script với quyền root: sudo bash deploy_vps.sh${NC}"
  exit 1
fi

# 2. Phát hiện IP Public của VPS
VPS_IP=$(curl -sf -4 --max-time 5 ifconfig.me || curl -sf -4 --max-time 5 icanhazip.com || hostname -I | awk '{print $1}' || echo "localhost")
echo -e "${BLUE}ℹ️  Địa chỉ IPv4 Public của VPS:${NC} ${GREEN}$VPS_IP${NC}"

# 3. Thiết lập Swap RAM 4GB nếu chưa đủ (chống tràn RAM khi build Next.js / Python trên VPS 4GB)
SWAP_TOTAL=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_TOTAL" -lt 3500 ]; then
  echo -e "${YELLOW}⚙️  Đang tạo 4GB Swap RAM ảo chống tràn bộ nhớ cho gói VPS 4GB...${NC}"
  swapoff -a 2>/dev/null || true
  rm -f /swapfile 2>/dev/null || true
  fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q "/swapfile" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo -e "${GREEN}✅ Swap RAM 4GB đã kích hoạt thành công!${NC}"
else
  echo -e "${GREEN}✅ Hệ thống đã có sẵn Swap RAM: ${SWAP_TOTAL}MB.${NC}"
fi

# 4. Kiểm tra và cài đặt Docker + Docker Compose nếu chưa có
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚙️  Đang cài đặt Docker Engine và Docker Compose plugin...${NC}"
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg lsb-release
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc 2>/dev/null || true
  chmod a+r /etc/apt/keyrings/docker.asc 2>/dev/null || true
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}✅ Docker đã được cài đặt thành công!${NC}"
else
  echo -e "${GREEN}✅ Docker đã cài sẵn: $(docker --version)${NC}"
fi

# 5. Cấu hình file .env.docker
if [ ! -f .env.docker ]; then
  echo -e "${YELLOW}⚙️  Tạo file cấu hình .env.docker từ .env.docker.example...${NC}"
  cp .env.docker.example .env.docker
fi
# Cập nhật địa chỉ IP thật của VPS vào NEXT_PUBLIC_API_URL và NEXT_PUBLIC_WS_URL
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$VPS_IP:3001/api|g" .env.docker
sed -i "s|NEXT_PUBLIC_WS_URL=.*|NEXT_PUBLIC_WS_URL=http://$VPS_IP:3001|g" .env.docker
echo -e "${GREEN}✅ Đã cấu hình IP $VPS_IP vào .env.docker!${NC}"

# 6. Mở tường lửa UFW (nếu UFW đang bật)
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
  echo -e "${YELLOW}⚙️  Cấu hình Firewall UFW mở các port cần thiết...${NC}"
  ufw allow 22/tcp   # SSH
  ufw allow 80/tcp   # HTTP
  ufw allow 443/tcp  # HTTPS
  ufw allow 3000/tcp # Frontend Next.js Web
  ufw allow 3001/tcp # Backend NestJS API
  ufw allow 8000/tcp # ML FastAPI
  ufw allow 1883/tcp # MQTT Broker ESP32
  ufw allow 9001/tcp # MQTT WebSocket
  echo -e "${GREEN}✅ Tường lửa đã mở các port: 22, 80, 443, 3000, 3001, 8000, 1883, 9001.${NC}"
fi

# 7. Build tuần tự và Khởi động Container Docker (chống nghẽn RAM và CPU khi build đồng thời trên 2 vCPU 4GB)
echo -e "${YELLOW}🐳 Đang dọn dẹp container cũ nếu có...${NC}"
docker compose --env-file .env.docker down --remove-orphans 2>/dev/null || true

echo -e "${YELLOW}🔨 [1/3] Đang build Frontend Next.js (truyền NEXT_PUBLIC_API_URL=http://$VPS_IP:3001/api)...${NC}"
docker compose --env-file .env.docker build --build-arg NEXT_PUBLIC_API_URL=http://$VPS_IP:3001/api --build-arg NEXT_PUBLIC_WS_URL=http://$VPS_IP:3001 frontend

echo -e "${YELLOW}🔨 [2/3] Đang build ML Microservice Python (LightGBM / FastAPI)...${NC}"
docker compose --env-file .env.docker build ml-service

echo -e "${YELLOW}🔨 [3/3] Đang build Backend NestJS API...${NC}"
docker compose --env-file .env.docker build backend

echo -e "${YELLOW}🚀 Đang khởi chạy toàn bộ Container (Backend, Frontend, ML, InfluxDB, Mosquitto)...${NC}"
docker compose --env-file .env.docker up -d

# 8. Chờ Backend sẵn sàng và Seed dữ liệu Demo
echo -e "${YELLOW}⏳ Đang chờ Backend khởi tạo database và đồng bộ dữ liệu mẫu...${NC}"
sleep 15
docker compose --env-file .env.docker exec -T backend npx prisma db push --accept-data-loss || true
docker compose --env-file .env.docker exec -T backend node dist/prisma/seed-demo.js || true

# 9. In kết quả hoàn tất
echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}🎉 SMARTDORM ĐÃ TRIỂN KHAI THÀNH CÔNG TRÊN CLOUD VPS!                 ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "🌐 ${CYAN}Giao Diện Web (Dashboard):${NC}  http://${VPS_IP}:3000"
echo -e "🔌 ${CYAN}Backend RESTful API Docs:${NC}   http://${VPS_IP}:3001/api/docs"
echo -e "🧠 ${CYAN}AI / ML Microservice Docs:${NC}  http://${VPS_IP}:8000/docs"
echo -e "📡 ${CYAN}MQTT Broker (ESP32):${NC}        ${VPS_IP}:1883"
echo -e "👤 ${CYAN}Tài khoản Quản lý (Admin):${NC}  admin@ktx.edu.vn / admin123"
echo -e "🎓 ${CYAN}Tài khoản Sinh viên (User):${NC} sv001@student.edu.vn / sinhvien123"
echo -e "${GREEN}======================================================================${NC}\n"
