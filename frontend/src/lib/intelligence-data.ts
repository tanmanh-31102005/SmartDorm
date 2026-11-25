/**
 * SmartDorm Intelligence & AI Data Layer
 * Models, Telemetry Forecasting, Isolation Forest Anomalies, Occupancy Heatmap, and Actionable AI Recommendations
 */

export interface ModelMetric {
  id: string;
  name: string;
  code: string;
  version: string;
  type: 'FORECAST' | 'ANOMALY' | 'CLASSIFIER' | 'RECOMMENDER';
  status: 'ACTIVE' | 'EXPERIMENTAL' | 'STANDBY' | 'DEPRECATED';
  trainedAt: string; // ISO date
  datasetRange: string;
  trainingSamples: number;
  mae?: number;
  rmse?: number;
  mape?: number;
  r2?: number;
  f1Score?: number;
  precision?: number;
  recall?: number;
  latencyMs: number;
  features: string[];
  description: string;
  isStale: boolean;
}

export interface DeviceAnomaly {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'AIR_CON' | 'LIGHT' | 'FAN' | 'DOOR_LOCK' | 'RELAY' | 'HEATER';
  roomId: string;
  roomNumber: string;
  buildingName: string;
  anomalyScore: number; // 0 to 1 (higher = more anomalous)
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'NORMAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  detectedAt: string;
  normalBehavior: string;
  currentBehavior: string;
  deviations: {
    feature: string;
    expected: string;
    actual: string;
    deviationPercent: string;
  }[];
  evidence: string[];
  recommendation: string;
  llmExplanation?: string;
  actionPayload?: {
    actionType: 'POWER_OFF' | 'REBOOT' | 'MAINTENANCE_TICKET' | 'LIMIT_CURRENT';
    targetId: string;
  };
}

export interface AIRecommendation {
  id: string;
  category: 'ENERGY' | 'DEVICE' | 'SECURITY' | 'OCCUPANCY' | 'MAINTENANCE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  reason: string;
  evidence: string[];
  confidence: number; // 0 to 100
  potentialImpact: string;
  savingsEstimate?: string;
  status: 'PENDING' | 'EXECUTED' | 'DISMISSED';
  createdAt: string;
  actionLabel: string;
  llmRationale?: string;
  executionPlan: {
    step: number;
    description: string;
    target: string;
  }[];
  location?: string;
}

export interface RoomOccupancyPrediction {
  roomId: string;
  roomNumber: string;
  buildingName: string;
  floor: number;
  currentOccupied: number;
  capacity: number;
  predictedOccupancyRate: number; // 0 to 100%
  expectedStudents: number;
  peakHour: string;
  status: 'HIGH' | 'MODERATE' | 'LOW' | 'VACANT';
  confidence: number;
  recommendedHvacState: 'ECO' | 'COMFORT' | 'OFF';
}

export interface EnergyForecastPoint {
  time: string;
  actual?: number;
  forecast: number;
  lowerBound: number;
  upperBound: number;
  gbm?: number;    // Gradient Boosting Champion
}

export interface FeatureImportanceItem {
  feature: string;
  nameVi: string;
  category: 'TIME' | 'SENSOR' | 'DEVICE';
  importance: number; // 0 to 1
  description: string;
}

export const GBM_FEATURE_IMPORTANCES: FeatureImportanceItem[] = [
  { feature: 'sin_hour', nameVi: 'Chu kỳ giờ (Sin)', category: 'TIME', importance: 0.245, description: 'Đặc trưng chu kỳ tuần hoàn 24h trong ngày' },
  { feature: 'cos_hour', nameVi: 'Chu kỳ giờ (Cos)', category: 'TIME', importance: 0.182, description: 'Phân biệt ngày, đêm và khung giờ sinh hoạt' },
  { feature: 'light_on', nameVi: 'Trạng thái Rơ-le Đèn', category: 'DEVICE', importance: 0.154, description: 'Tín hiệu đóng ngắt thiết bị chiếu sáng' },
  { feature: 'fan_on', nameVi: 'Trạng thái Rơ-le Quạt', category: 'DEVICE', importance: 0.128, description: 'Tín hiệu quạt làm mát phòng KTX' },
  { feature: 'temperature_norm', nameVi: 'Nhiệt độ DHT22', category: 'SENSOR', importance: 0.095, description: 'Biến thiên vi khí hậu thời gian thực' },
  { feature: 'occupancy_signal', nameVi: 'Hiện diện sinh viên', category: 'SENSOR', importance: 0.072, description: 'Tín hiệu chuyển động và quẹt thẻ phòng' },
  { feature: 'is_weekend', nameVi: 'Ngày cuối tuần', category: 'TIME', importance: 0.045, description: 'Phân loại sinh hoạt thứ Bảy & Chủ Nhật' },
  { feature: 'is_class_time', nameVi: 'Khung giờ học tập', category: 'TIME', importance: 0.038, description: 'Giờ học trên giảng đường (08:00 - 17:00)' },
  { feature: 'gas_level_norm', nameVi: 'Khí gas MQ-2', category: 'SENSOR', importance: 0.021, description: 'Nồng độ khí gas/khói môi trường' },
  { feature: 'humidity_norm', nameVi: 'Độ ẩm không khí', category: 'SENSOR', importance: 0.015, description: 'Độ ẩm tương đối đo từ cảm biến DHT22' },
  { feature: 'cos_dow', nameVi: 'Thứ trong tuần (Cos)', category: 'TIME', importance: 0.005, description: 'Chu kỳ các ngày làm việc trong tuần' },
];

export interface ModelBenchmarkComparison {
  activeModel: string;
  bestPerformingModel: string;
  bestModelCode: string;
  maeDeltaPercent: number;
  evaluationTimestamp: string;
  models: {
    modelId: string;
    name: string;
    code: string;
    type: string;
    status: 'ACTIVE' | 'STANDBY' | 'EXPERIMENTAL' | 'CHALLENGER' | 'DEPRECATED';
    totalKwh: number;
    peakPowerW: number;
    averagePowerW: number;
    latencyMs: number;
    metrics: {
      mae: number;
      rmse: number;
      mape: number;
      r2Score: number;
    };
    recommendedFor: string;
  }[];
}

// -------------------------------------------------------------
// AI Models Catalog
// -------------------------------------------------------------
export const AI_MODELS_DATA: ModelMetric[] = [
  {
    id: 'mdl-gbm-v2',
    name: 'IoT Telemetry & Load Forecaster (Champion GBM)',
    code: 'telemetry_gbm_v2.0.joblib',
    version: 'v2.0.0',
    type: 'FORECAST',
    status: 'ACTIVE',
    trainedAt: '2026-08-29T06:50:48Z',
    datasetRange: 'smartdorm-telemetry-v1 (103,680 records)',
    trainingSamples: 103680,
    mae: 4.28,
    rmse: 6.50,
    mape: 3.69,
    r2: 0.9607,
    latencyMs: 8,
    features: ['sin_hour', 'cos_hour', 'sin_dow', 'cos_dow', 'is_weekend', 'is_night', 'is_class_time', 'temperature_norm', 'humidity_norm', 'gas_level_norm', 'light_on', 'fan_on', 'occupancy_signal'],
    description: 'Mô hình Gradient Boosting Champion dự báo xu hướng vi khí hậu và tải hoạt động thiết bị 24h từ 13 đặc trưng cảm biến DHT22, MQ-2 và rơ-le.',
    isStale: false,
  },
  {
    id: 'mdl-iforest-v1',
    name: 'Isolation Forest Anomaly Detector',
    code: 'isolation_forest_v1.joblib',
    version: 'v1.3.0',
    type: 'ANOMALY',
    status: 'ACTIVE',
    trainedAt: '2026-08-15T02:30:00Z',
    datasetRange: '15/03/2026 - 15/08/2026 (980K telemetry packets)',
    trainingSamples: 980000,
    f1Score: 0.942,
    precision: 0.961,
    recall: 0.924,
    latencyMs: 6,
    features: ['temperature_std', 'gas_spike_rate', 'packet_latency_ms', 'unusual_hour_activity', 'duty_cycle_deviation'],
    description: 'Thuật toán học không giám sát phát hiện kẹt rơ-le, rò rỉ khí gas MQ-2 hoặc nhiệt độ vi khí hậu dị thường.',
    isStale: false,
  },
  {
    id: 'mdl-occupancy-v1',
    name: 'Spatial Occupancy XGBoost Classifier',
    code: 'occupancy_xgb_v1.json',
    version: 'v1.2.2',
    type: 'CLASSIFIER',
    status: 'ACTIVE',
    trainedAt: '2026-08-16T14:15:00Z',
    datasetRange: '01/02/2026 - 15/08/2026 (520K RFID & sensor records)',
    trainingSamples: 520000,
    f1Score: 0.928,
    precision: 0.935,
    recall: 0.921,
    latencyMs: 4,
    features: ['rfid_net_entry_sum', 'motion_gradient', 'temperature', 'active_devices_count', 'time_block'],
    description: 'Mô hình kết hợp dữ liệu quẹt thẻ RFID và cảm biến vi khí hậu để ước lượng số lượng sinh viên có mặt thực tế trong phòng KTX.',
    isStale: false,
  },
];

// -------------------------------------------------------------
// Model Benchmark Comparison Data — Champion GBM Only
// -------------------------------------------------------------
export const MODEL_BENCHMARK_COMPARISON: ModelBenchmarkComparison = {
  activeModel: 'Gradient Boosting Champion (GBM)',
  bestPerformingModel: 'Gradient Boosting Champion (GBM)',
  bestModelCode: 'energy-gbm-v2.0',
  maeDeltaPercent: 71.3,
  evaluationTimestamp: '2026-08-29T06:50:48Z',
  models: [
    {
      modelId: 'mdl-gbm-v2',
      name: 'Gradient Boosting Champion (GBM)',
      code: 'energy-gbm-v2.0',
      type: 'ENSEMBLE (CHAMPION)',
      status: 'ACTIVE',
      totalKwh: 3.48,
      peakPowerW: 201.8,
      averagePowerW: 145.0,
      latencyMs: 8,
      metrics: { mae: 8.28, rmse: 12.50, mape: 4.69, r2Score: 0.9607 },
      recommendedFor: 'Mô hình Champion duy nhất phục vụ toàn bộ tác vụ suy luận thời gian thực',
    },
  ],
};

// -------------------------------------------------------------
// Device Anomalies Data
// -------------------------------------------------------------
export const DEVICE_ANOMALIES_DATA: DeviceAnomaly[] = [
  {
    id: 'anom-001',
    deviceId: 'dev-ac-b204',
    deviceName: 'Điều Hòa Daikin Inverter (Phòng B204)',
    deviceType: 'AIR_CON',
    roomId: 'room-b204',
    roomNumber: '204',
    buildingName: 'B',
    anomalyScore: 0.96,
    severity: 'CRITICAL',
    status: 'OPEN',
    detectedAt: '12 phút trước (21:15)',
    normalBehavior: 'Công suất tiêu chuẩn 350W - 850W khi duy trì nhiệt độ 26°C.',
    currentBehavior: 'Dòng điện tăng vọt liên tục 2.450W trong 45 phút, nhiệt độ phòng không giảm mà tăng lên 48.5°C.',
    deviations: [
      { feature: 'Công suất tiêu thụ', expected: '650 W', actual: '2,450 W', deviationPercent: '+276.9%' },
      { feature: 'Độ trễ phản hồi MQTT', expected: '15 ms', actual: '240 ms', deviationPercent: '+1,500%' },
      { feature: 'Nhiệt độ cục nóng ước tính', expected: '38.0 °C', actual: '64.2 °C', deviationPercent: '+68.9%' },
    ],
    evidence: [
      'Ghi nhận 18 gói tin telemetry liên tiếp vượt ngưỡng công suất danh định 1.200W.',
      'Cảm biến nhiệt độ DHT22 phòng B204 ghi nhận mức nhiệt bất thường 48.5°C.',
      'Cảnh báo MQ-2 nồng độ khí gas/khói đạt 68% tại cùng thời điểm.',
    ],
    recommendation: 'Ngắt ngay rơ-le cấp nguồn cho khối điều hòa P.B204 để ngăn ngừa cháy nổ và chập mạch điện tử.',
    llmExplanation: 'AI phát hiện điều hòa phòng B204 tiêu thụ 2.450W (gấp 3.7 lần bình thường) kèm nhiệt độ phòng tăng 48.5°C. Phân tích: Nguy cơ bó cứng máy nén (Compressor Lock) hoặc chập cuộn dây động cơ quạt dàn nóng gây quá nhiệt cực độ. Khuyến nghị kỹ thuật viên ngắt CB nguồn khẩn cấp.',
    actionPayload: { actionType: 'POWER_OFF', targetId: 'dev-ac-b204' },
  },
  {
    id: 'anom-002',
    deviceId: 'dev-relay-a103',
    deviceName: 'Rơ-le Quạt Hút Thông Gió (Phòng A103)',
    deviceType: 'RELAY',
    roomId: 'room-a103',
    roomNumber: '103',
    buildingName: 'A',
    anomalyScore: 0.84,
    severity: 'HIGH',
    status: 'OPEN',
    detectedAt: '38 phút trước (20:49)',
    normalBehavior: 'Chu kỳ đóng ngắt theo cảm biến MQ-2, tắt khi khí gas < 20%.',
    currentBehavior: 'Rơ-le bị kẹt ở trạng thái ON liên tục 6 tiếng dù tín hiệu lệnh OFF đã gửi 4 lần.',
    deviations: [
      { feature: 'Thời gian ON liên tục', expected: '< 30 phút', actual: '360 phút', deviationPercent: '+1,100%' },
      { feature: 'Phản hồi trạng thái ACK', expected: 'OK', actual: 'TIMEOUT / NO-ACK', deviationPercent: 'Lỗi giao tiếp' },
      { feature: 'Tải rơ-le cơ', expected: '0.2 A', actual: '0.85 A', deviationPercent: '+325%' },
    ],
    evidence: [
      'Command Pattern ghi nhận 4 lệnh RELAY_OFF thất bại do tiếp điểm đóng dính.',
      'Cảm biến dòng CT clamp ghi nhận dòng tải duy trì không ngắt.',
    ],
    recommendation: 'Cắt nguồn nhánh phụ tải và cử nhân viên kỹ thuật bảo trì thay thế module rơ-le tiếp điểm.',
    llmExplanation: 'Rơ-le quạt hút phòng A103 không phản hồi 4 lệnh ngắt liên tiếp, duy trì dòng 0.85A trong 6 giờ. Nguyên nhân kỹ thuật: Hồ quang điện đã làm dính tiếp điểm cơ khí rơ-le (Relay Contact Welding). Cần thay module rơ-le quang cách ly mới.',
    actionPayload: { actionType: 'MAINTENANCE_TICKET', targetId: 'dev-relay-a103' },
  },
  {
    id: 'anom-003',
    deviceId: 'dev-light-c301',
    deviceName: 'Đèn Tuyp LED Hành Lang P.C301',
    deviceType: 'LIGHT',
    roomId: 'room-c301',
    roomNumber: '301',
    buildingName: 'C',
    anomalyScore: 0.72,
    severity: 'WARNING',
    status: 'OPEN',
    detectedAt: '1 giờ trước (20:20)',
    normalBehavior: 'Chỉ hoạt động khi phát hiện chuyển động hoặc từ 18:00 - 23:00.',
    currentBehavior: 'Chớp nháy chu kỳ 1.2 giây (Flickering), tiêu thụ công suất dao động thất thường 5W - 48W.',
    deviations: [
      { feature: 'Tần số dao động tải', expected: 'Ổn định 50Hz', actual: 'Nhấp nháy 0.83Hz', deviationPercent: 'Dao động' },
      { feature: 'Hao tổn công suất', expected: '18 W', actual: '48 W peak', deviationPercent: '+166%' },
    ],
    evidence: [
      'Bộ driver LED có dấu hiệu phồng tụ nguồn sau 18 tháng hoạt động.',
      'Sinh viên phòng C301 phản ánh hiện tượng đèn nhấp nháy gây khó chịu.',
    ],
    recommendation: 'Lên lịch thay thế chấn lưu LED trong phiên làm việc sáng mai.',
    llmExplanation: 'Đèn LED hành lang P.C301 có chu kỳ nhấp nháy 1.2s và công suất dao động tới 48W. Phân tích: Tụ lọc nguồn của bộ Driver LED đã bị khô/giảm dung lượng sau thời gian dài sử dụng. Cần thay chấn lưu LED để đảm bảo ánh sáng an toàn.',
    actionPayload: { actionType: 'MAINTENANCE_TICKET', targetId: 'dev-light-c301' },
  },
  {
    id: 'anom-004',
    deviceId: 'dev-lock-a201',
    deviceName: 'Khóa Điện Từ Smart Lock (Phòng A201)',
    deviceType: 'DOOR_LOCK',
    roomId: 'room-201',
    roomNumber: '201',
    buildingName: 'A',
    anomalyScore: 0.58,
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    detectedAt: '2 giờ trước (19:15)',
    normalBehavior: 'Dòng kích chốt 12V 600mA trong 3 giây khi quẹt thẻ thành công.',
    currentBehavior: 'Độ trễ phản hồi servo tăng từ 120ms lên 1.850ms do ma sát cơ khí chốt cửa.',
    deviations: [
      { feature: 'Thời gian bung chốt', expected: '150 ms', actual: '1,850 ms', deviationPercent: '+1,133%' },
      { feature: 'Dòng khởi động', expected: '600 mA', actual: '920 mA', deviationPercent: '+53.3%' },
    ],
    evidence: [
      'Ghi nhận 14 lượt mở khóa gần nhất có thời gian kích hoạt cao bất thường.',
    ],
    recommendation: 'Tra dầu bôi trơn rãnh chốt cửa và cân chỉnh lại khớp khóa nam châm điện.',
    llmExplanation: 'Khóa cửa phòng A201 bị tăng dòng khởi động lên 920mA và thời gian bung chốt kéo dài 1.85s. Nguyên nhân: Ma sát cơ khí rãnh chốt do bụi bẩn hoặc lệch tâm khuôn cửa. Cần bảo dưỡng bôi trơn cơ cấu chốt.',
    actionPayload: { actionType: 'MAINTENANCE_TICKET', targetId: 'dev-lock-a201' },
  },
];

// -------------------------------------------------------------
// AI Recommendations Data
// -------------------------------------------------------------
export const AI_RECOMMENDATIONS_DATA: AIRecommendation[] = [
  {
    id: 'rec-001',
    category: 'MAINTENANCE',
    severity: 'HIGH',
    title: 'Kích hoạt quạt hút thông gió giải phóng khí Gas MQ-2 tích tụ',
    description: 'Hệ thống AI phân tích cảm biến MQ-2 phát hiện nồng độ khí gas/khói tăng dần trong giờ sinh hoạt. Kích hoạt thông gió tự động đưa không khí về ngưỡng an toàn.',
    reason: 'Cảm biến MQ-2 và mô hình Anomaly Detection dự báo nguy cơ tích tụ khí gas vượt ngưỡng 350 ppm. Tự động bật quạt thông gió (Relay 2) giúp bảo vệ an toàn PCCC tuyệt đối.',
    evidence: [
      'Cảm biến MQ-2 ghi nhận nồng độ khí gas tăng dần lên 280 - 340 ppm.',
      'Cảm biến nhiệt độ DHT22 ghi nhận mức nhiệt 30.5°C.',
      'Rơ-le quạt thông gió (GPIO 14) hiện đang ở trạng thái TẮT (OFF).',
    ],
    confidence: 96,
    potentialImpact: 'Đảm bảo an toàn PCCC tuyệt đối · Cải thiện chất lượng vi khí hậu',
    savingsEstimate: 'Ngăn ngừa 100% rủi ro cháy nổ & ngạt khí',
    status: 'PENDING',
    createdAt: '15 phút trước',
    actionLabel: 'Kích Hoạt Quạt Thông Gió',
    llmRationale: 'AI khuyến nghị kích hoạt rơ-le quạt thông gió (GPIO 14) để giải phóng khí gas tích tụ về ngưỡng an toàn < 200 ppm, tuân thủ tiêu chuẩn an toàn PCCC KTX thông minh.',
    executionPlan: [
      { step: 1, description: 'Gửi lệnh MQTT kích hoạt rơ-le quạt thông gió (FAN_ON)', target: 'Fan Relay GPIO 14' },
      { step: 2, description: 'Duy trì thông gió trong 15 phút đến khi MQ-2 < 200 ppm', target: 'Auto-timer Strategy' },
      { step: 3, description: 'Phát thông báo xác nhận an toàn về Dashboard và Telegram', target: 'Notification Service' },
    ],
  },
  {
    id: 'rec-002',
    category: 'DEVICE',
    severity: 'MEDIUM',
    title: 'Tắt thiết bị tại các phòng xác định trống (Vacant Rooms) quá 20 phút',
    description: 'Mô hình Occupancy Classifier phát hiện phòng không có người qua thẻ RFID nhưng đèn và quạt vẫn đang đóng tiếp điểm.',
    reason: 'Không ghi nhận sinh viên quẹt thẻ vào phòng, thẻ sinh viên đã quẹt ra ngoài > 20 phút trước, rơ-le đèn và quạt vẫn duy trì trạng thái BẬT.',
    evidence: [
      'Sinh viên đã quẹt thẻ RFID rời phòng > 20 phút trước.',
      'Mô hình XGBoost xác định xác suất phòng trống đạt 98%.',
      'Đèn chiếu sáng (Relay 1) và Quạt (Relay 2) vẫn đang đóng tiếp điểm.',
    ],
    confidence: 98,
    potentialImpact: 'Giảm hao mòn tiếp điểm rơ-le · Tránh quá nhiệt thiết bị phòng trống',
    savingsEstimate: 'Giảm 45 giờ chạy rơ-le không cần thiết/tháng',
    status: 'PENDING',
    createdAt: '30 phút trước',
    actionLabel: 'Tắt Thiết Bị Phòng Trống',
    llmRationale: 'Phòng xác định không có sinh viên hiện diện qua lượt quẹt thẻ RFID. Tự động ngắt rơ-le đèn chiếu sáng và quạt giúp bảo vệ tuổi thọ thiết bị, phòng chống chập cháy và tối ưu hóa vận hành KTX.',
    executionPlan: [
      { step: 1, description: 'Gửi lệnh Command Pattern tắt đèn chiếu sáng (LIGHT_OFF)', target: 'Light Relay GPIO 25' },
      { step: 2, description: 'Gửi lệnh Command Pattern tắt quạt thông gió (FAN_OFF)', target: 'Fan Relay GPIO 14' },
      { step: 3, description: 'Cập nhật trạng thái an toàn lên Dashboard', target: 'Events Gateway' },
    ],
  },
];

// -------------------------------------------------------------
// Occupancy Heatmap Data (by Building & Room)
// -------------------------------------------------------------
export const OCCUPANCY_HEATMAP_DATA: RoomOccupancyPrediction[] = [
  { roomId: 'room-a101', roomNumber: '101', buildingName: 'A', floor: 1, currentOccupied: 4, capacity: 4, predictedOccupancyRate: 94, expectedStudents: 4, peakHour: '21:00 - 23:00', status: 'HIGH', confidence: 97, recommendedHvacState: 'COMFORT' },
  { roomId: 'room-a102', roomNumber: '102', buildingName: 'A', floor: 1, currentOccupied: 3, capacity: 4, predictedOccupancyRate: 75, expectedStudents: 3, peakHour: '20:00 - 22:00', status: 'HIGH', confidence: 92, recommendedHvacState: 'COMFORT' },
  { roomId: 'room-a103', roomNumber: '103', buildingName: 'A', floor: 1, currentOccupied: 1, capacity: 4, predictedOccupancyRate: 25, expectedStudents: 1, peakHour: '22:00 - 00:00', status: 'LOW', confidence: 88, recommendedHvacState: 'ECO' },
  { roomId: 'room-a104', roomNumber: '104', buildingName: 'A', floor: 1, currentOccupied: 0, capacity: 4, predictedOccupancyRate: 5, expectedStudents: 0, peakHour: '23:00 - 01:00', status: 'VACANT', confidence: 99, recommendedHvacState: 'OFF' },
  { roomId: 'room-a201', roomNumber: '201', buildingName: 'A', floor: 2, currentOccupied: 4, capacity: 4, predictedOccupancyRate: 98, expectedStudents: 4, peakHour: '20:30 - 23:30', status: 'HIGH', confidence: 96, recommendedHvacState: 'COMFORT' },
  { roomId: 'room-b204', roomNumber: '204', buildingName: 'B', floor: 2, currentOccupied: 4, capacity: 4, predictedOccupancyRate: 88, expectedStudents: 4, peakHour: '20:00 - 23:00', status: 'HIGH', confidence: 91, recommendedHvacState: 'OFF' },
];

export const HOURLY_OCCUPANCY_CURVE = [
  { hour: '00:00', occupancyPercent: 96, studentsPresent: 808, avgKwh: 14.2 },
  { hour: '04:00', occupancyPercent: 98, studentsPresent: 825, avgKwh: 11.8 },
  { hour: '08:00', occupancyPercent: 32, studentsPresent: 269, avgKwh: 28.4 },
  { hour: '12:00', occupancyPercent: 68, studentsPresent: 572, avgKwh: 58.0 },
  { hour: '16:00', occupancyPercent: 42, studentsPresent: 353, avgKwh: 48.6 },
  { hour: '20:00', occupancyPercent: 91, studentsPresent: 766, avgKwh: 92.5 },
  { hour: '22:00', occupancyPercent: 97, studentsPresent: 816, avgKwh: 86.4 },
];

export const ENERGY_FORECAST_24H: EnergyForecastPoint[] = [
  { time: '00:00', actual: 48.2,  forecast: 47.8,  lowerBound: 44.5,  upperBound: 51.2,  gbm: 47.8 },
  { time: '02:00', actual: 39.5,  forecast: 40.1,  lowerBound: 37.0,  upperBound: 43.2,  gbm: 40.1 },
  { time: '04:00', actual: 36.1,  forecast: 36.8,  lowerBound: 34.0,  upperBound: 39.5,  gbm: 36.8 },
  { time: '06:00', actual: 49.8,  forecast: 51.2,  lowerBound: 47.5,  upperBound: 54.8,  gbm: 51.2 },
  { time: '08:00', actual: 68.4,  forecast: 67.2,  lowerBound: 62.5,  upperBound: 71.9,  gbm: 67.2 },
  { time: '10:00', actual: 74.1,  forecast: 75.0,  lowerBound: 70.2,  upperBound: 79.8,  gbm: 75.0 },
  { time: '12:00', actual: 88.5,  forecast: 89.2,  lowerBound: 83.5,  upperBound: 94.8,  gbm: 89.2 },
  { time: '14:00', actual: 79.2,  forecast: 78.4,  lowerBound: 73.0,  upperBound: 83.8,  gbm: 78.4 },
  { time: '16:00', actual: 81.6,  forecast: 82.5,  lowerBound: 77.0,  upperBound: 88.0,  gbm: 82.5 },
  { time: '18:00', actual: 91.2,  forecast: 92.4,  lowerBound: 86.5,  upperBound: 98.3,  gbm: 92.4 },
  { time: '20:00', actual: undefined, forecast: 98.4, lowerBound: 91.2, upperBound: 105.6, gbm: 98.4 },
  { time: '22:00', actual: undefined, forecast: 86.1, lowerBound: 79.8, upperBound: 92.4,  gbm: 86.1 },
];

export const ENERGY_FORECAST_7D: EnergyForecastPoint[] = [
  { time: 'T2 (10/08)', actual: 18420, forecast: 18250, lowerBound: 17400, upperBound: 19100, gbm: 18250 },
  { time: 'T3 (11/08)', actual: 18910, forecast: 18800, lowerBound: 17950, upperBound: 19650, gbm: 18800 },
  { time: 'T4 (12/08)', actual: 18120, forecast: 18300, lowerBound: 17500, upperBound: 19100, gbm: 18300 },
  { time: 'T5 (13/08)', actual: 19040, forecast: 18950, lowerBound: 18100, upperBound: 19800, gbm: 18950 },
  { time: 'T6 (14/08)', actual: 19560, forecast: 19400, lowerBound: 18500, upperBound: 20300, gbm: 19400 },
  { time: 'T7 (15/08)', actual: 16820, forecast: 16900, lowerBound: 16100, upperBound: 17700, gbm: 16900 },
  { time: 'CN (16/08)', actual: undefined, forecast: 17250, lowerBound: 16400, upperBound: 18100, gbm: 17250 },
];

export const ENERGY_FORECAST_30D: EnergyForecastPoint[] = [
  { time: 'Tuần 1', actual: 124500, forecast: 123800, lowerBound: 118000, upperBound: 129600, gbm: 123800 },
  { time: 'Tuần 2', actual: 128900, forecast: 127600, lowerBound: 121500, upperBound: 133700, gbm: 127600 },
  { time: 'Tuần 3', actual: undefined, forecast: 126400, lowerBound: 119800, upperBound: 133000, gbm: 126400 },
  { time: 'Tuần 4', actual: undefined, forecast: 129200, lowerBound: 122000, upperBound: 136400, gbm: 129200 },
];
