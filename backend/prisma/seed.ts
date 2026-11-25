/**
 * Seed script — Tạo dữ liệu KTX thực tế và Hybrid Database Telemetry
 * Chạy: npx ts-node prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding real SmartDorm Database...');

  // 1. Tạo Tòa Nhà
  const buildingA = await prisma.building.upsert({
    where: { name: 'A' },
    update: {},
    create: { name: 'A', address: 'Khu A, Ký Túc Xá Sinh Viên', floors: 5 },
  });

  const buildingB = await prisma.building.upsert({
    where: { name: 'B' },
    update: {},
    create: { name: 'B', address: 'Khu B, Ký Túc Xá Sinh Viên', floors: 5 },
  });

  const buildingC = await prisma.building.upsert({
    where: { name: 'C' },
    update: {},
    create: { name: 'C', address: 'Khu C, Ký Túc Xá Sinh Viên', floors: 6 },
  });

  console.log('✅ Buildings seeded');

  // 2. Tạo Phòng KTX
  const roomA101 = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: buildingA.id, roomNumber: '101' } },
    update: {},
    create: { roomNumber: '101', floor: 1, capacity: 4, buildingId: buildingA.id, espDeviceId: 'esp32-room-A101' },
  });

  const roomA102 = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: buildingA.id, roomNumber: '102' } },
    update: {},
    create: { roomNumber: '102', floor: 1, capacity: 4, buildingId: buildingA.id, espDeviceId: 'esp32-room-A102' },
  });

  const roomA103 = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: buildingA.id, roomNumber: '103' } },
    update: {},
    create: { roomNumber: '103', floor: 1, capacity: 4, buildingId: buildingA.id, espDeviceId: 'esp32-room-A103' },
  });

  const roomB204 = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: buildingB.id, roomNumber: '204' } },
    update: {},
    create: { roomNumber: '204', floor: 2, capacity: 4, buildingId: buildingB.id, espDeviceId: 'esp32-room-B204' },
  });

  const roomC301 = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: buildingC.id, roomNumber: '301' } },
    update: {},
    create: { roomNumber: '301', floor: 3, capacity: 4, buildingId: buildingC.id, espDeviceId: 'esp32-room-C301' },
  });

  console.log('✅ Rooms seeded');

  // 3. Tạo Thiết Bị IoT cho các phòng
  const roomsList = [roomA101, roomA102, roomA103, roomB204, roomC301];
  for (const r of roomsList) {
    const devices = [
      { name: `Đèn Chiếu Sáng P.${r.roomNumber}`, type: 'LIGHT', roomId: r.id, isOn: true, isOnline: true },
      { name: `Quạt Thông Gió P.${r.roomNumber}`, type: 'FAN', roomId: r.id, isOn: false, isOnline: true },
      { name: `Khóa Cửa Điện Tử P.${r.roomNumber}`, type: 'DOOR_LOCK', roomId: r.id, isOn: true, isOnline: true },
      { name: `Còi Báo Động P.${r.roomNumber}`, type: 'BUZZER', roomId: r.id, isOn: false, isOnline: true },
    ];
    for (const d of devices) {
      const exists = await prisma.device.findFirst({ where: { name: d.name, roomId: d.roomId } });
      if (!exists) {
        await prisma.device.create({ data: d });
      }
    }
  }

  console.log('✅ IoT Devices seeded');

  // 4. Tạo Users (Admin & Sinh viên thực)
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@ktx.edu.vn' },
    update: {},
    create: {
      studentId: 'ADMIN001',
      fullName: 'Nguyễn Tấn Mạnh',
      email: 'admin@ktx.edu.vn',
      passwordHash: adminHash,
      role: 'ADMIN',
      phone: '0909123456',
    },
  });

  const svHash = await bcrypt.hash('sinhvien123', 10);
  const students = [
    { studentId: 'SV2024001', fullName: 'Nguyễn Văn An', email: 'sv001@student.edu.vn', rfid: 'CARD_A1B2C3D4', phone: '0901234567', roomId: roomA101.id },
    { studentId: 'SV2024002', fullName: 'Trần Thị Bình', email: 'sv002@student.edu.vn', rfid: 'CARD_E5F6G7H8', phone: '0907654321', roomId: roomA101.id },
    { studentId: 'SV2024003', fullName: 'Lê Văn Cường', email: 'sv003@student.edu.vn', rfid: 'CARD_I9J0K1L2', phone: '0912345678', roomId: roomA102.id },
    { studentId: 'SV2024004', fullName: 'Phạm Minh Đức', email: 'sv004@student.edu.vn', rfid: 'CARD_M3N4O5P6', phone: '0912345679', roomId: roomA101.id },
    { studentId: 'SV2024005', fullName: 'Hoàng Quốc Việt', email: 'sv005@student.edu.vn', rfid: 'CARD_Q7R8S9T0', phone: '0987654321', roomId: roomA101.id },
  ];

  for (const s of students) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        studentId: s.studentId,
        fullName: s.fullName,
        email: s.email,
        passwordHash: svHash,
        role: 'STUDENT',
        rfidCardId: s.rfid,
        phone: s.phone,
        roomId: s.roomId,
      },
    });
  }

  console.log('✅ Users seeded');

  // 5. Tạo Dữ Liệu Cảm Biến Time-Series Thực Tế (SensorData)
  const now = Date.now();
  for (let i = 20; i >= 0; i--) {
    const recordedAt = new Date(now - i * 3 * 1000); // Mỗi điểm cách nhau 3 giây
    await prisma.sensorData.create({
      data: {
        temperature: Math.round((27.2 + Math.sin(i * 0.3) * 0.8) * 10) / 10,
        humidity: Math.round((64.0 + Math.cos(i * 0.3) * 2.0) * 10) / 10,
        gasLevel: Math.round((16.5 + Math.sin(i * 0.5) * 2.5) * 10) / 10,
        gasAlert: false,
        tempAlert: false,
        roomId: roomA101.id,
        recordedAt,
      },
    });
  }

  console.log('✅ 20 Time-series Sensor Data points seeded');

  // 6. Tạo Access Logs Mẫu
  const sampleLogs = [
    { card: 'CARD_A1B2C3D4', action: 'entry', authorized: true, roomId: roomA101.id, time: new Date(now - 1000 * 60 * 5) },
    { card: 'CARD_E5F6G7H8', action: 'entry', authorized: true, roomId: roomA101.id, time: new Date(now - 1000 * 60 * 30) },
    { card: 'CARD_INVALID99', action: 'denied', authorized: false, roomId: roomA101.id, time: new Date(now - 1000 * 60 * 60) },
    { card: 'CARD_A1B2C3D4', action: 'exit', authorized: true, roomId: roomA101.id, time: new Date(now - 1000 * 60 * 120) },
  ];

  for (const l of sampleLogs) {
    const u = await prisma.user.findFirst({ where: { rfidCardId: l.card } });
    await prisma.accessLog.create({
      data: {
        rfidCardId: l.card,
        action: l.action,
        authorized: l.authorized,
        roomId: l.roomId,
        userId: u?.id || null,
        timestamp: l.time,
      },
    });
  }

  console.log('✅ Access Logs seeded');

  // 8. Tạo ML Models & Registry
  const defaultModels = [
    {
      modelName: 'energy-gbm',
      modelType: 'FORECAST',
      version: 'v2.1',
      status: 'ACTIVE',
      trainedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
      datasetStart: new Date(now - 1000 * 60 * 60 * 24 * 90),
      datasetEnd: new Date(now - 1000 * 60 * 60 * 24 * 3),
      metrics: JSON.stringify({ mae: 0.38, rmse: 0.54, mape: 3.12, r2: 0.965 }),
      inferenceMs: 8,
      notes: 'Gradient Boosting Regressor (GBM) Champion - mô hình dự báo tối ưu phụ tải KTX.',
    },
    {
      modelName: 'energy-baseline',
      modelType: 'FORECAST',
      version: 'v1.0',
      status: 'ACTIVE',
      trainedAt: new Date(now - 1000 * 60 * 60 * 24 * 7),
      datasetStart: new Date(now - 1000 * 60 * 60 * 24 * 30),
      datasetEnd: new Date(now),
      metrics: JSON.stringify({ mae: 0.89, rmse: 1.34, mape: 7.95, r2: 0.881 }),
      inferenceMs: 3,
      notes: 'Diurnal cyclic baseline using same-hour moving average with weekend dampening.',
    },
    {
      modelName: 'device-anomaly-iforest',
      modelType: 'ANOMALY',
      version: 'v1.4',
      status: 'ACTIVE',
      trainedAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
      datasetStart: new Date(now - 1000 * 60 * 60 * 24 * 60),
      datasetEnd: new Date(now - 1000 * 60 * 60 * 24 * 5),
      metrics: JSON.stringify({ precision: 0.94, recall: 0.91, f1: 0.925, falsePositiveRate: 0.03 }),
      inferenceMs: 8,
      notes: 'Scikit-Learn IsolationForest tuned on nominal electrical load profiles and latency metrics.',
    },
    {
      modelName: 'occupancy-proxy-classifier',
      modelType: 'OCCUPANCY',
      version: 'v1.2',
      status: 'ACTIVE',
      trainedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      datasetStart: new Date(now - 1000 * 60 * 60 * 24 * 45),
      datasetEnd: new Date(now - 1000 * 60 * 60 * 24 * 2),
      metrics: JSON.stringify({ accuracy: 0.923, f1: 0.918, precision: 0.935, recall: 0.902 }),
      inferenceMs: 6,
      notes: 'Multi-signal Bayesian occupancy estimator fusing badge recency, PIR sensor, and live wattage.',
    },
  ];

  for (const m of defaultModels) {
    const existing = await prisma.mlModel.findFirst({ where: { modelName: m.modelName, version: m.version } });
    if (!existing) {
      await prisma.mlModel.create({ data: m });
    }
  }
  console.log('✅ ML Models seeded');

  // 9. Tạo Automation Rules
  const defaultRules = [
    {
      name: 'Tự Động Tắt Thiết Bị Phòng Trống (Eco Vacancy)',
      description: 'Tự động tắt đèn và quạt khi phòng không có người trên 15 phút để tiết kiệm điện năng',
      conditions: JSON.stringify([
        { field: 'occupancyProbability', operator: 'LESS_THAN', value: 0.15 },
        { field: 'powerW', operator: 'GREATER_THAN', value: 10 },
      ]),
      actions: JSON.stringify([
        { type: 'LIGHT_OFF', target: 'ALL_LIGHTS' },
        { type: 'FAN_OFF', target: 'ROOM_FAN' },
      ]),
      priority: 80,
      enabled: true,
      cooldownMs: 900000,
    },
    {
      name: 'Cảnh Báo Quá Tải Điện Thiết Bị',
      description: 'Phát hiện thiết bị tiêu thụ vượt 200% định mức, tạo cảnh báo bảo trì cho kỹ thuật viên',
      conditions: JSON.stringify([
        { field: 'powerW', operator: 'GREATER_THAN', value: 200 },
      ]),
      actions: JSON.stringify([
        { type: 'RECOMMENDATION', payload: { message: 'Kiểm tra hiện tượng quá tải điện tại phòng' } },
      ]),
      priority: 30,
      enabled: true,
      cooldownMs: 1800000,
    },
  ];

  for (const r of defaultRules) {
    const existingRule = await prisma.automationRule.findFirst({ where: { name: r.name } });
    if (!existingRule) {
      await prisma.automationRule.create({ data: r });
    }
  }
  console.log('✅ Automation Rules seeded');

  // 10. Tạo AI Recommendations ban đầu
  const sampleRecommendations = [
    {
      type: 'ENERGY',
      severity: 'WARNING',
      title: 'Tòa B: Dự Báo Điện Năng Giờ Cao Điểm Tăng 14.2%',
      description: 'Dự báo tiêu thụ điện lúc 19:30 - 21:30 sẽ đạt đỉnh 1.84 kW/h do thời tiết oi bức.',
      location: 'Building B',
      reason: 'Dự báo GBM phát hiện xu hướng tiêu thụ điện tăng 14.2% so với baseline cùng kỳ.',
      recommendation: 'Kích hoạt chính sách ECO Mode cho điều hòa hành lang và điều chỉnh nhiệt độ phòng tự động.',
      confidence: 0.94,
      evidence: JSON.stringify({ baselineKwh: 1.61, forecastKwh: 1.84, deltaPct: 14.2 }),
      status: 'PENDING',
    },
    {
      type: 'DEVICE',
      severity: 'HIGH',
      title: 'Quạt Thông Gió P204 Tải Cao Bất Thường (145W)',
      description: 'Thiết bị Quạt P204 tiêu thụ 145W liên tục (định mức danh định 60W).',
      location: 'B-204',
      reason: 'Isolation Forest phát hiện Anomaly Score 0.88 với dòng điện tăng 141%.',
      recommendation: 'Cử nhân viên kỹ thuật kiểm tra kẹt bạc đạn motor quạt phòng B204.',
      confidence: 0.91,
      evidence: JSON.stringify({ nominalWatts: 60, currentWatts: 145, anomalyScore: 0.88 }),
      status: 'PENDING',
    },
    {
      type: 'OCCUPANCY',
      severity: 'INFO',
      title: 'Tối Ưu Hóa Chiếu Sáng Hành Lang Tầng 3 Tòa A',
      description: 'Xác suất lưu trú các phòng tầng 3 dưới 10% từ 08:30 đến 11:30 sáng.',
      location: 'Building A - Floor 3',
      reason: 'Phân tích lịch học sinh viên cho thấy 85% sinh viên có tiết học tại giảng đường.',
      recommendation: 'Tự động giảm 50% độ sáng đèn hành lang và tắt quạt khu vực chung.',
      confidence: 0.88,
      evidence: JSON.stringify({ vacantRatio: 0.90, timeWindow: '08:30-11:30' }),
      status: 'PENDING',
    },
  ];

  for (const rec of sampleRecommendations) {
    const existingRec = await prisma.aiRecommendation.findFirst({ where: { title: rec.title } });
    if (!existingRec) {
      await prisma.aiRecommendation.create({ data: rec });
    }
  }
  console.log('✅ AI Recommendations seeded');
  console.log('🎉 Database seeding completed successfully with full Intelligence Layer!');
}


main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
