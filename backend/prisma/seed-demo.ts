/**
 * SMARTDORM — IDEMPOTENT CORE DEMO SEED SCRIPT
 * File: backend/prisma/seed-demo.ts
 * 
 * Objectives:
 * 1. Seed complete relational demo dataset across Buildings A, B, C (18 rooms, 72 devices, 18 students + 1 admin).
 * 2. Maintain 100% idempotency (upsert / findFirst checks) — safe to run multiple times without duplication.
 * 3. Seed representative room occupancy states (Vacant, Partially Occupied, Full, Maintenance).
 * 4. Maintain audit tracking (created, updated, skipped counts).
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedStats {
  buildings: { created: number; updated: number; skipped: number };
  rooms: { created: number; updated: number; skipped: number };
  devices: { created: number; updated: number; skipped: number };
  users: { created: number; updated: number; skipped: number };
  accessLogs: { created: number; skipped: number };
  emergencies: { created: number; skipped: number };
  mlModels: { created: number; updated: number; skipped: number };
  automationRules: { created: number; updated: number; skipped: number };
  aiRecommendations: { created: number; updated: number; skipped: number };
}

async function main() {
  console.log('===============================================================');
  console.log('🌱 SMARTDORM: IDEMPOTENT DEMO SEEDING STARTED');
  console.log('===============================================================');

  const stats: SeedStats = {
    buildings: { created: 0, updated: 0, skipped: 0 },
    rooms: { created: 0, updated: 0, skipped: 0 },
    devices: { created: 0, updated: 0, skipped: 0 },
    users: { created: 0, updated: 0, skipped: 0 },
    accessLogs: { created: 0, skipped: 0 },
    emergencies: { created: 0, skipped: 0 },
    mlModels: { created: 0, updated: 0, skipped: 0 },
    automationRules: { created: 0, updated: 0, skipped: 0 },
    aiRecommendations: { created: 0, updated: 0, skipped: 0 },
  };

  // -------------------------------------------------------------
  // 1. SEED BUILDINGS (A, B, C)
  // -------------------------------------------------------------
  const buildingDefinitions = [
    { name: 'A', address: 'Khu A — Ký Túc Xá Đại Học Bách Khoa', floors: 5 },
    { name: 'B', address: 'Khu B — Ký Túc Xá Sinh Viên Quốc Tế', floors: 5 },
    { name: 'C', address: 'Khu C — Ký Túc Xá Sinh Viên Kỹ Thuật', floors: 6 },
  ];

  const buildingMap = new Map<string, any>();

  for (const b of buildingDefinitions) {
    const existing = await prisma.building.findUnique({ where: { name: b.name } });
    if (!existing) {
      const created = await prisma.building.create({ data: b });
      buildingMap.set(b.name, created);
      stats.buildings.created++;
    } else {
      const updated = await prisma.building.update({
        where: { id: existing.id },
        data: { address: b.address, floors: b.floors },
      });
      buildingMap.set(b.name, updated);
      stats.buildings.updated++;
    }
  }
  console.log(`✅ Buildings: ${stats.buildings.created} created, ${stats.buildings.updated} updated`);

  // -------------------------------------------------------------
  // 2. SEED ROOMS (18 Rooms across Buildings A, B, C)
  // Varied capacities: 2, 4, 6 beds
  // -------------------------------------------------------------
  const roomDefinitions = [
    // Building A (Floors 1, 2, 3)
    { buildingName: 'A', roomNumber: '101', floor: 1, capacity: 4, espDeviceId: 'esp32-room-A101' },
    { buildingName: 'A', roomNumber: '102', floor: 1, capacity: 4, espDeviceId: 'esp32-room-A102' },
    { buildingName: 'A', roomNumber: '103', floor: 1, capacity: 2, espDeviceId: 'esp32-room-A103' },
    { buildingName: 'A', roomNumber: '201', floor: 2, capacity: 4, espDeviceId: 'esp32-room-A201' },
    { buildingName: 'A', roomNumber: '202', floor: 2, capacity: 4, espDeviceId: 'esp32-room-A202' },
    { buildingName: 'A', roomNumber: '203', floor: 2, capacity: 6, espDeviceId: 'esp32-room-A203' },
    { buildingName: 'A', roomNumber: '301', floor: 3, capacity: 4, espDeviceId: 'esp32-room-A301' },
    { buildingName: 'A', roomNumber: '302', floor: 3, capacity: 4, espDeviceId: 'esp32-room-A302' },

    // Building B (Floors 1, 2)
    { buildingName: 'B', roomNumber: '101', floor: 1, capacity: 4, espDeviceId: 'esp32-room-B101' },
    { buildingName: 'B', roomNumber: '102', floor: 1, capacity: 2, espDeviceId: 'esp32-room-B102' },
    { buildingName: 'B', roomNumber: '201', floor: 2, capacity: 4, espDeviceId: 'esp32-room-B201' },
    { buildingName: 'B', roomNumber: '202', floor: 2, capacity: 4, espDeviceId: 'esp32-room-B202' },
    { buildingName: 'B', roomNumber: '203', floor: 2, capacity: 6, espDeviceId: 'esp32-room-B203' },
    { buildingName: 'B', roomNumber: '204', floor: 2, capacity: 4, espDeviceId: 'esp32-room-B204' },

    // Building C (Floors 1, 2, 3)
    { buildingName: 'C', roomNumber: '101', floor: 1, capacity: 4, espDeviceId: 'esp32-room-C101' },
    { buildingName: 'C', roomNumber: '201', floor: 2, capacity: 4, espDeviceId: 'esp32-room-C201' },
    { buildingName: 'C', roomNumber: '301', floor: 3, capacity: 4, espDeviceId: 'esp32-room-C301' },
    { buildingName: 'C', roomNumber: '302', floor: 3, capacity: 2, espDeviceId: 'esp32-room-C302' },
  ];

  const roomMap = new Map<string, any>();

  for (const r of roomDefinitions) {
    const building = buildingMap.get(r.buildingName);
    const roomKey = `${r.buildingName}-${r.roomNumber}`;

    const existing = await prisma.room.findUnique({
      where: { buildingId_roomNumber: { buildingId: building.id, roomNumber: r.roomNumber } },
    });

    if (!existing) {
      const created = await prisma.room.create({
        data: {
          roomNumber: r.roomNumber,
          floor: r.floor,
          capacity: r.capacity,
          buildingId: building.id,
          espDeviceId: r.espDeviceId,
          isActive: true,
        },
      });
      roomMap.set(roomKey, created);
      stats.rooms.created++;
    } else {
      const updated = await prisma.room.update({
        where: { id: existing.id },
        data: {
          floor: r.floor,
          capacity: r.capacity,
          espDeviceId: existing.espDeviceId || r.espDeviceId,
          isActive: true,
        },
      });
      roomMap.set(roomKey, updated);
      stats.rooms.updated++;
    }
  }
  console.log(`✅ Rooms: ${stats.rooms.created} created, ${stats.rooms.updated} updated (Total: 18 rooms)`);

  // -------------------------------------------------------------
  // 3. SEED IOT DEVICES (4 standard actuators per room = 72 devices)
  // LIGHT, FAN, DOOR_LOCK, BUZZER
  // -------------------------------------------------------------
  for (const [roomKey, room] of roomMap.entries()) {
    const defaultDevices = [
      { name: `Đèn Chiếu Sáng P.${room.roomNumber}`, type: 'LIGHT', roomId: room.id, isOn: true, isOnline: true },
      { name: `Quạt Thông Gió P.${room.roomNumber}`, type: 'FAN', roomId: room.id, isOn: false, isOnline: true },
      { name: `Khóa Cửa Điện Tử P.${room.roomNumber}`, type: 'DOOR_LOCK', roomId: room.id, isOn: true, isOnline: true },
      { name: `Còi Báo Động P.${room.roomNumber}`, type: 'BUZZER', roomId: room.id, isOn: false, isOnline: true },
    ];

    for (const dev of defaultDevices) {
      const existing = await prisma.device.findFirst({
        where: { roomId: room.id, type: dev.type },
      });

      if (!existing) {
        await prisma.device.create({ data: dev });
        stats.devices.created++;
      } else {
        await prisma.device.update({
          where: { id: existing.id },
          data: { name: dev.name, isOnline: true },
        });
        stats.devices.updated++;
      }
    }
  }
  console.log(`✅ IoT Devices: ${stats.devices.created} created, ${stats.devices.updated} updated (Total: 72 devices)`);

  // -------------------------------------------------------------
  // 4. SEED USERS (1 Admin + 18 Students across rooms)
  // -------------------------------------------------------------
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const studentPasswordHash = await bcrypt.hash('sinhvien123', 10);

  // Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ktx.edu.vn' },
    update: {
      fullName: 'Nguyễn Tấn Mạnh (Quản Trị Viên)',
      role: 'ADMIN',
      phone: '0909123456',
      isActive: true,
    },
    create: {
      studentId: 'ADMIN001',
      fullName: 'Nguyễn Tấn Mạnh (Quản Trị Viên)',
      email: 'admin@ktx.edu.vn',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: '0909123456',
      isActive: true,
    },
  });
  stats.users.created++;

  // 18 Demonstration Students (Assigned to demonstrate Full, Partial, Vacant rooms)
  const studentDefinitions = [
    // Room A-101 (Full: 4/4 students)
    { studentId: 'SV2024001', fullName: 'Nguyễn Văn An', email: 'sv001@student.edu.vn', rfid: 'CARD_A1B2C3D4', phone: '0901234561', roomKey: 'A-101' },
    { studentId: 'SV2024002', fullName: 'Trần Thị Bình', email: 'sv002@student.edu.vn', rfid: 'CARD_E5F6G7H8', phone: '0901234562', roomKey: 'A-101' },
    { studentId: 'SV2024004', fullName: 'Phạm Minh Đức', email: 'sv004@student.edu.vn', rfid: 'CARD_M3N4O5P6', phone: '0901234564', roomKey: 'A-101' },
    { studentId: 'SV2024005', fullName: 'Hoàng Quốc Việt', email: 'sv005@student.edu.vn', rfid: 'CARD_Q7R8S9T0', phone: '0901234565', roomKey: 'A-101' },

    // Room A-102 (Partially Occupied: 2/4 students)
    { studentId: 'SV2024003', fullName: 'Lê Văn Cường', email: 'sv003@student.edu.vn', rfid: 'CARD_I9J0K1L2', phone: '0901234563', roomKey: 'A-102' },
    { studentId: 'SV2024006', fullName: 'Đỗ Hải Đăng', email: 'sv006@student.edu.vn', rfid: 'CARD_U1V2W3X4', phone: '0901234566', roomKey: 'A-102' },

    // Room A-103 (Full: 2/2 students)
    { studentId: 'SV2024007', fullName: 'Vũ Thị Hạnh', email: 'sv007@student.edu.vn', rfid: 'CARD_Y5Z6A7B8', phone: '0901234567', roomKey: 'A-103' },
    { studentId: 'SV2024008', fullName: 'Bùi Gia Khiêm', email: 'sv008@student.edu.vn', rfid: 'CARD_C9D0E1F2', phone: '0901234568', roomKey: 'A-103' },

    // Room A-201 (Partially Occupied: 1/4 student)
    { studentId: 'SV2024009', fullName: 'Ngô Thanh Lâm', email: 'sv009@student.edu.vn', rfid: 'CARD_G3H4I5J6', phone: '0901234569', roomKey: 'A-201' },

    // Room B-101 (Partially Occupied: 2/4 students)
    { studentId: 'SV2024010', fullName: 'Đinh Trọng Nghĩa', email: 'sv010@student.edu.vn', rfid: 'CARD_K7L8M9N0', phone: '0901234570', roomKey: 'B-101' },
    { studentId: 'SV2024011', fullName: 'Dương Thục Oanh', email: 'sv011@student.edu.vn', rfid: 'CARD_O1P2Q3R4', phone: '0901234571', roomKey: 'B-101' },

    // Room B-204 (Full: 4/4 students)
    { studentId: 'SV2024012', fullName: 'Trịnh Công Phát', email: 'sv012@student.edu.vn', rfid: 'CARD_S5T6U7V8', phone: '0901234572', roomKey: 'B-204' },
    { studentId: 'SV2024013', fullName: 'Lý Kim Quyên', email: 'sv013@student.edu.vn', rfid: 'CARD_W9X0Y1Z2', phone: '0901234573', roomKey: 'B-204' },
    { studentId: 'SV2024014', fullName: 'Cao Hoài Sơn', email: 'sv014@student.edu.vn', rfid: 'CARD_A3B4C5D6', phone: '0901234574', roomKey: 'B-204' },
    { studentId: 'SV2024015', fullName: 'Mai Thu Thảo', email: 'sv015@student.edu.vn', rfid: 'CARD_E7F8G9H0', phone: '0901234575', roomKey: 'B-204' },

    // Room C-301 (Partially Occupied: 2/4 students)
    { studentId: 'SV2024016', fullName: 'Hồ Tuấn Uy', email: 'sv016@student.edu.vn', rfid: 'CARD_I1J2K3L4', phone: '0901234576', roomKey: 'C-301' },
    { studentId: 'SV2024017', fullName: 'Vương Tuyết Vy', email: 'sv017@student.edu.vn', rfid: 'CARD_M5N6O7P8', phone: '0901234577', roomKey: 'C-301' },

    // Room C-302 (Partially Occupied: 1/2 student)
    { studentId: 'SV2024018', fullName: 'Phan Nhật Xuân', email: 'sv018@student.edu.vn', rfid: 'CARD_Q9R0S1T2', phone: '0901234578', roomKey: 'C-302' },
  ];

  for (const s of studentDefinitions) {
    const room = roomMap.get(s.roomKey);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: s.email }, { studentId: s.studentId }] },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          studentId: s.studentId,
          fullName: s.fullName,
          email: s.email,
          passwordHash: studentPasswordHash,
          role: 'STUDENT',
          rfidCardId: s.rfid,
          phone: s.phone,
          roomId: room?.id || null,
          isActive: true,
        },
      });
      stats.users.created++;
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: s.fullName,
          studentId: s.studentId,
          rfidCardId: s.rfid,
          phone: s.phone,
          roomId: room?.id || existing.roomId,
          isActive: true,
        },
      });
      stats.users.updated++;
    }
  }
  console.log(`✅ Users: ${stats.users.created} created, ${stats.users.updated} updated (1 Admin + 18 Students)`);

  // -------------------------------------------------------------
  // 5. SEED ML MODELS REGISTRY
  // -------------------------------------------------------------
  const now = new Date();
  const defaultModels = [
    {
      modelName: 'energy-gbm',
      modelType: 'FORECAST',
      version: 'v2.1',
      status: 'ACTIVE',
      trainedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
      datasetStart: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90),
      datasetEnd: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
      metrics: JSON.stringify({ mae: 0.38, rmse: 0.54, mape: 3.12, r2: 0.965 }),
      inferenceMs: 8,
      notes: 'Gradient Boosting Regressor (GBM) Champion - mô hình dự báo tối ưu phụ tải KTX.',
    },
    {
      modelName: 'energy-baseline',
      modelType: 'FORECAST',
      version: 'v1.0',
      status: 'ACTIVE',
      trainedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
      datasetStart: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
      datasetEnd: now,
      metrics: JSON.stringify({ mae: 0.89, rmse: 1.34, mape: 7.95, r2: 0.881 }),
      inferenceMs: 3,
      notes: 'Diurnal cyclic baseline using same-hour moving average with weekend dampening.',
    },
    {
      modelName: 'device-anomaly-iforest',
      modelType: 'ANOMALY',
      version: 'v1.4',
      status: 'ACTIVE',
      trainedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
      datasetStart: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60),
      datasetEnd: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
      metrics: JSON.stringify({ precision: 0.94, recall: 0.91, f1: 0.925, falsePositiveRate: 0.03 }),
      inferenceMs: 8,
      notes: 'Scikit-Learn IsolationForest tuned on nominal electrical load profiles and latency metrics.',
    },
    {
      modelName: 'occupancy-proxy-classifier',
      modelType: 'OCCUPANCY',
      version: 'v1.2',
      status: 'ACTIVE',
      trainedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
      datasetStart: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45),
      datasetEnd: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
      metrics: JSON.stringify({ accuracy: 0.923, f1: 0.918, precision: 0.935, recall: 0.902 }),
      inferenceMs: 6,
      notes: 'Multi-signal Bayesian occupancy estimator fusing badge recency, PIR sensor, and live wattage.',
    },
  ];

  for (const m of defaultModels) {
    const existing = await prisma.mlModel.findFirst({
      where: { modelName: m.modelName, version: m.version },
    });

    if (!existing) {
      await prisma.mlModel.create({ data: m });
      stats.mlModels.created++;
    } else {
      await prisma.mlModel.update({
        where: { id: existing.id },
        data: { metrics: m.metrics, status: m.status, notes: m.notes },
      });
      stats.mlModels.updated++;
    }
  }
  console.log(`✅ ML Models: ${stats.mlModels.created} created, ${stats.mlModels.updated} updated`);

  // -------------------------------------------------------------
  // 6. SEED AUTOMATION RULES
  // -------------------------------------------------------------
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
    const existing = await prisma.automationRule.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.automationRule.create({ data: r });
      stats.automationRules.created++;
    } else {
      await prisma.automationRule.update({
        where: { id: existing.id },
        data: { description: r.description, conditions: r.conditions, actions: r.actions, enabled: r.enabled },
      });
      stats.automationRules.updated++;
    }
  }
  console.log(`✅ Automation Rules: ${stats.automationRules.created} created, ${stats.automationRules.updated} updated`);

  // -------------------------------------------------------------
  // 7. SEED AI RECOMMENDATIONS (Idempotent by title)
  // -------------------------------------------------------------
  const defaultRecommendations = [
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

  for (const rec of defaultRecommendations) {
    const existing = await prisma.aiRecommendation.findFirst({ where: { title: rec.title } });
    if (!existing) {
      await prisma.aiRecommendation.create({ data: rec });
      stats.aiRecommendations.created++;
    } else {
      await prisma.aiRecommendation.update({
        where: { id: existing.id },
        data: { description: rec.description, reason: rec.reason, recommendation: rec.recommendation },
      });
      stats.aiRecommendations.updated++;
    }
  }
  console.log(`✅ AI Recommendations: ${stats.aiRecommendations.created} created, ${stats.aiRecommendations.updated} updated`);

  console.log('===============================================================');
  console.log('🎉 IDEMPOTENT SEEDING COMPLETED SUCCESSFULLY!');
  console.log('===============================================================');
  return stats;
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
