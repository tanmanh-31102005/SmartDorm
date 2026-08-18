/**
 * SmartDorm Unified Campus Data Layer
 * Models & Consistent Enterprise Dataset for Smart Campus IoT Management Platform
 */

export interface CampusKPI {
  totalRooms: number;
  totalRoomsChange: string;
  activeDevices: number;
  onlineDevicesPercent: string;
  onlineDevicesCount: number;
  offlineDevicesCount: number;
  warningDevicesCount: number;
  energyConsumptionKwh: number;
  energyChangePercent: string;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  warningAlertsCount: number;
  totalStudents: number;
  doorsOnlineCount: number;
  totalDoorsCount: number;
  accessEventsToday: number;
  unauthorizedAttempts: number;
  securityHealthScore: number;
}

export interface BuildingData {
  id: string;
  name: string;
  address: string;
  floors: number;
  totalRooms: number;
  occupiedRooms: number;
  deviceCount: number;
  alertCount: number;
  energyUsageTodayKwh: number;
  avgTemperature: number;
  avgHumidity: number;
  occupancyRate: number;
}

export interface RoomData {
  id: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  occupied: number;
  buildingId: string;
  buildingName: string;
  temperature: number;
  humidity: number;
  gasLevel: number;
  gasAlert: boolean;
  tempAlert: boolean;
  status: 'normal' | 'warning' | 'critical';
  devicesCount: number;
  devices?: any[];
  residents: {
    id: string;
    studentId: string;
    fullName: string;
    phone: string;
    rfidMasked: string;
  }[];
}

export interface IoTDevice {
  id: string;
  name: string;
  type: 'LIGHT' | 'FAN' | 'DOOR_LOCK' | 'BUZZER' | 'AIR_CON';
  roomId: string;
  roomNumber: string;
  buildingName: string;
  isOn: boolean;
  isOnline: boolean;
  lastSeen: string;
  powerWatts: number;
}

export interface IncidentAlert {
  id: string;
  type: 'FIRE' | 'GAS_LEAK' | 'INTRUSION' | 'POWER_OUTAGE';
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  roomId: string;
  roomNumber: string;
  buildingName: string;
  sensorValue?: number;
  threshold?: number;
  timestamp: string;
  isResolved: boolean;
  actionsTaken: string[];
}

export interface AccessRecord {
  id: string;
  rfidMasked: string;
  rawCardId: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  buildingName: string;
  direction: 'ENTRY' | 'EXIT';
  authorized: boolean;
  timestamp: string;
  doorName: string;
}

export interface EnergyPoint {
  time: string;
  buildingA: number;
  buildingB: number;
  buildingC: number;
  total: number;
}

export const CAMPUS_KPI: CampusKPI = {
  totalRooms: 248,
  totalRoomsChange: '+4.2%',
  activeDevices: 1186,
  onlineDevicesPercent: '98.4%',
  onlineDevicesCount: 1168,
  offlineDevicesCount: 18,
  warningDevicesCount: 6,
  energyConsumptionKwh: 18420,
  energyChangePercent: '-8.6%',
  activeAlertsCount: 3,
  criticalAlertsCount: 2,
  warningAlertsCount: 1,
  totalStudents: 842,
  doorsOnlineCount: 196,
  totalDoorsCount: 198,
  accessEventsToday: 1284,
  unauthorizedAttempts: 4,
  securityHealthScore: 98,
};

export const BUILDINGS_DATA: BuildingData[] = [
  {
    id: 'b-a',
    name: 'A',
    address: 'Khu A — KTX Đại học Bách Khoa',
    floors: 5,
    totalRooms: 80,
    occupiedRooms: 72,
    deviceCount: 384,
    alertCount: 1,
    energyUsageTodayKwh: 6420,
    avgTemperature: 27.2,
    avgHumidity: 63,
    occupancyRate: 90,
  },
  {
    id: 'b-b',
    name: 'B',
    address: 'Khu B — KTX Đại học Bách Khoa',
    floors: 5,
    totalRooms: 72,
    occupiedRooms: 68,
    deviceCount: 350,
    alertCount: 1,
    energyUsageTodayKwh: 5890,
    avgTemperature: 27.8,
    avgHumidity: 66,
    occupancyRate: 94,
  },
  {
    id: 'b-c',
    name: 'C',
    address: 'Khu C — KTX Đại học Bách Khoa',
    floors: 6,
    totalRooms: 96,
    occupiedRooms: 81,
    deviceCount: 452,
    alertCount: 1,
    energyUsageTodayKwh: 6110,
    avgTemperature: 26.9,
    avgHumidity: 61,
    occupancyRate: 84,
  },
];

export const INITIAL_ROOMS: RoomData[] = [
  {
    id: 'room-101',
    roomNumber: '101',
    floor: 1,
    capacity: 4,
    occupied: 4,
    buildingId: 'b-a',
    buildingName: 'A',
    temperature: 27.4,
    humidity: 64,
    gasLevel: 18,
    gasAlert: false,
    tempAlert: false,
    status: 'normal',
    devicesCount: 5,
    residents: [
      { id: 'u-1', studentId: 'SV2024001', fullName: 'Nguyễn Văn An', phone: '0901234567', rfidMasked: 'CARD_****-C3D4' },
      { id: 'u-2', studentId: 'SV2024002', fullName: 'Trần Thị Bình', phone: '0907654321', rfidMasked: 'CARD_****-G7H8' },
      { id: 'u-3', studentId: 'SV2024004', fullName: 'Phạm Minh Đức', phone: '0912345678', rfidMasked: 'CARD_****-M3N4' },
      { id: 'u-4', studentId: 'SV2024005', fullName: 'Hoàng Quốc Việt', phone: '0987654321', rfidMasked: 'CARD_****-P5Q6' },
    ],
  },
  {
    id: 'room-102',
    roomNumber: '102',
    floor: 1,
    capacity: 4,
    occupied: 3,
    buildingId: 'b-a',
    buildingName: 'A',
    temperature: 26.8,
    humidity: 62,
    gasLevel: 15,
    gasAlert: false,
    tempAlert: false,
    status: 'normal',
    devicesCount: 4,
    residents: [
      { id: 'u-5', studentId: 'SV2024003', fullName: 'Lê Văn Cường', phone: '0912345678', rfidMasked: 'CARD_****-K1L2' },
      { id: 'u-6', studentId: 'SV2024006', fullName: 'Đỗ Hải Nam', phone: '0933445566', rfidMasked: 'CARD_****-R7S8' },
      { id: 'u-7', studentId: 'SV2024007', fullName: 'Vũ Trọng Hùng', phone: '0944556677', rfidMasked: 'CARD_****-T9U0' },
    ],
  },
  {
    id: 'room-201',
    roomNumber: '201',
    floor: 2,
    capacity: 4,
    occupied: 4,
    buildingId: 'b-a',
    buildingName: 'A',
    temperature: 27.5,
    humidity: 65,
    gasLevel: 22,
    gasAlert: false,
    tempAlert: false,
    status: 'normal',
    devicesCount: 4,
    residents: [
      { id: 'u-8', studentId: 'SV2024008', fullName: 'Ngô Bá Khang', phone: '0955667788', rfidMasked: 'CARD_****-V1W2' },
      { id: 'u-9', studentId: 'SV2024009', fullName: 'Bùi Tuấn Anh', phone: '0966778899', rfidMasked: 'CARD_****-X3Y4' },
      { id: 'u-10', studentId: 'SV2024010', fullName: 'Đặng Thanh Tùng', phone: '0977889900', rfidMasked: 'CARD_****-Z5A6' },
      { id: 'u-11', studentId: 'SV2024011', fullName: 'Trịnh Gia Bảo', phone: '0988990011', rfidMasked: 'CARD_****-B7C8' },
    ],
  },
  {
    id: 'room-b204',
    roomNumber: '204',
    floor: 2,
    capacity: 4,
    occupied: 4,
    buildingId: 'b-b',
    buildingName: 'B',
    temperature: 48.5,
    humidity: 78,
    gasLevel: 68,
    gasAlert: true,
    tempAlert: true,
    status: 'critical',
    devicesCount: 5,
    residents: [
      { id: 'u-12', studentId: 'SV2024012', fullName: 'Lý Quốc Dũng', phone: '0911223344', rfidMasked: 'CARD_****-D9E0' },
      { id: 'u-13', studentId: 'SV2024013', fullName: 'Võ Minh Thắng', phone: '0922334455', rfidMasked: 'CARD_****-F1G2' },
      { id: 'u-14', studentId: 'SV2024014', fullName: 'Mai Thế Vinh', phone: '0933445566', rfidMasked: 'CARD_****-H3I4' },
      { id: 'u-15', studentId: 'SV2024015', fullName: 'Hồ Chí Thanh', phone: '0944556677', rfidMasked: 'CARD_****-J5K6' },
    ],
  },
  {
    id: 'room-a103',
    roomNumber: '103',
    floor: 1,
    capacity: 4,
    occupied: 2,
    buildingId: 'b-a',
    buildingName: 'A',
    temperature: 28.1,
    humidity: 65,
    gasLevel: 42,
    gasAlert: true,
    tempAlert: false,
    status: 'warning',
    devicesCount: 4,
    residents: [
      { id: 'u-16', studentId: 'SV2024016', fullName: 'Dương Văn Long', phone: '0955667788', rfidMasked: 'CARD_****-L7M8' },
      { id: 'u-17', studentId: 'SV2024017', fullName: 'Phan Nhật Tân', phone: '0966778899', rfidMasked: 'CARD_****-N9O0' },
    ],
  },
  {
    id: 'room-c301',
    roomNumber: '301',
    floor: 3,
    capacity: 4,
    occupied: 4,
    buildingId: 'b-c',
    buildingName: 'C',
    temperature: 27.0,
    humidity: 60,
    gasLevel: 14,
    gasAlert: false,
    tempAlert: false,
    status: 'normal',
    devicesCount: 4,
    residents: [
      { id: 'u-18', studentId: 'SV2024018', fullName: 'Tô Hữu Phước', phone: '0977889900', rfidMasked: 'CARD_****-P1Q2' },
      { id: 'u-19', studentId: 'SV2024019', fullName: 'Cao Văn Đạt', phone: '0988990011', rfidMasked: 'CARD_****-R3S4' },
      { id: 'u-20', studentId: 'SV2024020', fullName: 'Lương Thế Hưng', phone: '0999001122', rfidMasked: 'CARD_****-T5U6' },
      { id: 'u-21', studentId: 'SV2024021', fullName: 'Khổng Minh Trí', phone: '0910111213', rfidMasked: 'CARD_****-V7W8' },
    ],
  },
];

export const INITIAL_ALERTS: IncidentAlert[] = [
  {
    id: 'alt-001',
    type: 'FIRE',
    level: 'CRITICAL',
    title: 'Phát hiện khói & nhiệt độ cao (Smoke Detected)',
    description: 'Cảm biến MQ-2 và DHT22 phát hiện nồng độ khói 68% và nhiệt độ 48.5°C vượt ngưỡng an toàn.',
    roomId: 'room-b204',
    roomNumber: '204',
    buildingName: 'B',
    sensorValue: 48.5,
    threshold: 45.0,
    timestamp: '2 phút trước',
    isResolved: false,
    actionsTaken: ['Tự động kích hoạt còi báo động', 'Mở toàn bộ khóa cửa điện', 'Gửi cảnh báo Telegram cho BQL'],
  },
  {
    id: 'alt-002',
    type: 'GAS_LEAK',
    level: 'WARNING',
    title: 'Cảnh báo rò rỉ khí Gas (Gas Leak Alert)',
    description: 'Cảm biến khí gas phòng A103 ghi nhận nồng độ 42%, vượt ngưỡng cảnh báo 40%.',
    roomId: 'room-a103',
    roomNumber: '103',
    buildingName: 'A',
    sensorValue: 42.0,
    threshold: 40.0,
    timestamp: '8 phút trước',
    isResolved: false,
    actionsTaken: ['Bật quạt hút thông gió', 'Còi cảnh báo cục bộ', 'Gửi thông báo tới sinh viên phòng'],
  },
  {
    id: 'alt-003',
    type: 'INTRUSION',
    level: 'WARNING',
    title: 'Phát hiện cửa bị cạy mở (Door Forced Open)',
    description: 'Cửa phòng C301 bị mở mà không qua quẹt thẻ RFID hợp lệ.',
    roomId: 'room-c301',
    roomNumber: '301',
    buildingName: 'C',
    timestamp: '15 phút trước',
    isResolved: false,
    actionsTaken: ['Khóa chốt điện tử', 'Ghi nhật ký vi phạm an ninh', 'Thông báo bảo vệ ca trực'],
  },
  {
    id: 'alt-004',
    type: 'FIRE',
    level: 'INFO',
    title: 'Nhiệt độ đã trở về mức an toàn',
    description: 'Phòng A201 nhiệt độ ổn định ở 27.5°C sau khi bật điều hòa.',
    roomId: 'room-201',
    roomNumber: '201',
    buildingName: 'A',
    timestamp: '32 phút trước',
    isResolved: true,
    actionsTaken: ['Tắt còi báo động', 'Khôi phục trạng thái thường'],
  },
];

export const INITIAL_ACCESS_LOGS: AccessRecord[] = [
  {
    id: 'log-001',
    rfidMasked: 'CARD_****-C3D4',
    rawCardId: 'CARD_A1B2C3D4',
    studentId: 'SV2024001',
    studentName: 'Nguyễn Văn An',
    roomNumber: '101',
    buildingName: 'A',
    direction: 'ENTRY',
    authorized: true,
    timestamp: '19:42:15',
    doorName: 'Cửa chính P.A101',
  },
  {
    id: 'log-002',
    rfidMasked: 'CARD_****-G7H8',
    rawCardId: 'CARD_E5F6G7H8',
    studentId: 'SV2024002',
    studentName: 'Trần Thị Bình',
    roomNumber: '101',
    buildingName: 'A',
    direction: 'ENTRY',
    authorized: true,
    timestamp: '19:38:02',
    doorName: 'Cửa chính P.A101',
  },
  {
    id: 'log-003',
    rfidMasked: 'CARD_****-8841',
    rawCardId: 'CARD_UNKNOWN_8841',
    studentId: 'UNKNOWN',
    studentName: 'Thẻ không hợp lệ',
    roomNumber: '103',
    buildingName: 'A',
    direction: 'ENTRY',
    authorized: false,
    timestamp: '19:28:44',
    doorName: 'Cửa chính P.A103',
  },
  {
    id: 'log-004',
    rfidMasked: 'CARD_****-K1L2',
    rawCardId: 'CARD_I9J0K1L2',
    studentId: 'SV2024003',
    studentName: 'Lê Văn Cường',
    roomNumber: '102',
    buildingName: 'A',
    direction: 'EXIT',
    authorized: true,
    timestamp: '19:15:30',
    doorName: 'Cửa chính P.A102',
  },
  {
    id: 'log-005',
    rfidMasked: 'CARD_****-D9E0',
    rawCardId: 'CARD_D9E01122',
    studentId: 'SV2024012',
    studentName: 'Lý Quốc Dũng',
    roomNumber: '204',
    buildingName: 'B',
    direction: 'ENTRY',
    authorized: true,
    timestamp: '18:50:11',
    doorName: 'Cửa chính P.B204',
  },
  {
    id: 'log-006',
    rfidMasked: 'CARD_****-9921',
    rawCardId: 'CARD_INVALID_9921',
    studentId: 'UNKNOWN',
    studentName: 'Thẻ chưa kích hoạt',
    roomNumber: '201',
    buildingName: 'A',
    direction: 'ENTRY',
    authorized: false,
    timestamp: '18:32:05',
    doorName: 'Cửa chính P.A201',
  },
];

export const ENERGY_TREND_DATA: EnergyPoint[] = [
  { time: '00:00', buildingA: 180, buildingB: 160, buildingC: 190, total: 530 },
  { time: '04:00', buildingA: 140, buildingB: 120, buildingC: 150, total: 410 },
  { time: '08:00', buildingA: 420, buildingB: 390, buildingC: 450, total: 1260 },
  { time: '12:00', buildingA: 680, buildingB: 620, buildingC: 710, total: 2010 },
  { time: '16:00', buildingA: 590, buildingB: 540, buildingC: 620, total: 1750 },
  { time: '18:00', buildingA: 820, buildingB: 780, buildingC: 860, total: 2460 },
  { time: '20:00', buildingA: 950, buildingB: 890, buildingC: 980, total: 2820 },
  { time: '22:00', buildingA: 780, buildingB: 720, buildingC: 810, total: 2310 },
];
