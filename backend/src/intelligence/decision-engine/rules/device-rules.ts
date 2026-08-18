import { DecisionEngineBuiltinRule, RuleEvaluationContext, EvaluationOutcome } from './energy-rules';

export const DEVICE_RULES: DecisionEngineBuiltinRule[] = [
  {
    id: 'builtin-safety-critical-thermal-gas',
    name: 'Bảo vệ an toàn khẩn cấp (Critical Safety: Thermal & Gas Override)',
    category: 'SAFETY',
    priority: 1, // HIGHEST PRIORITY (Cannot be overridden by ML or energy optimization)
    cooldownMs: 60 * 1000, // 1 min
    description: 'Ưu tiên số 1: Khi phát hiện nồng độ khí gas cao hoặc nhiệt độ cực đại, lập tức cảnh báo và ngắt thiết bị',
    conditions: [
      { field: 'gasAlert', operator: 'EQUALS', value: true },
      { field: 'temperature', operator: 'GREATER_THAN', value: 50.0 },
    ],
    actions: [
      { type: 'FAN_ON' }, // Thông gió khí gas
      { type: 'NOTIFY_ADMIN' },
      { type: 'DOOR_UNLOCK' }, // Mở cửa thoát hiểm
    ],
    evaluate: (ctx: RuleEvaluationContext): EvaluationOutcome => {
      const isGasEmergency = ctx.gasAlert === true || (ctx.gasLevel !== undefined && ctx.gasLevel > 400);
      const isThermalEmergency = ctx.tempAlert === true || (ctx.temperature !== undefined && ctx.temperature > 50.0);

      if (isGasEmergency || isThermalEmergency) {
        const hazardType = isGasEmergency ? 'RÒ RỈ KHÍ GAS' : 'NGUY CƠ HỎA HOẠN / NHIỆT ĐỘ CAO';
        return {
          matched: true,
          reason: `[CRITICAL SAFETY] Phát hiện sự cố khẩn cấp: ${hazardType} tại phòng ${ctx.roomNumber || ctx.roomId}`,
          severity: 'CRITICAL',
          recommendation: {
            type: 'SECURITY',
            title: `BÁO ĐỘNG KHẨN CẤP: ${hazardType} - Phòng ${ctx.roomNumber || ctx.roomId}`,
            description: `Cảm biến kích hoạt cảnh báo nguy hiểm mức độ cao nhất! Khí gas: ${ctx.gasLevel || 'N/A'}, Nhiệt độ: ${ctx.temperature || 'N/A'}°C.`,
            reason: `Quy tắc an toàn bất biến (Critical Safety Rule) kích hoạt tự động.`,
            recommendation: 'Sơ tán sinh viên, mở cửa thoát hiểm và bật quạt thông gió.',
            confidence: 1.0,
            actions: [
              { type: 'DOOR_UNLOCK', roomId: ctx.roomId },
              { type: 'FAN_ON', roomId: ctx.roomId },
              { type: 'NOTIFY_ADMIN', roomId: ctx.roomId },
            ],
            evidence: {
              gasLevel: ctx.gasLevel,
              gasAlert: ctx.gasAlert,
              temperature: ctx.temperature,
              tempAlert: ctx.tempAlert,
              priority: 1,
            },
          },
          actionsToExecute: [
            { type: 'DOOR_UNLOCK', targetRoomId: ctx.roomId },
            { type: 'FAN_ON', targetRoomId: ctx.roomId },
          ],
        };
      }
      return { matched: false };
    },
  },
  {
    id: 'builtin-device-maintenance-anomaly',
    name: 'Khuyến nghị bảo trì thiết bị khi phát hiện bất thường (Maintenance on Anomaly)',
    category: 'MAINTENANCE',
    priority: 30, // Operational
    cooldownMs: 60 * 60 * 1000, // 1 hour
    description: 'Tự động tạo phiếu khuyến nghị bảo dưỡng khi mô hình Isolation Forest hoặc thống kê phát hiện bất thường',
    conditions: [
      { field: 'anomalyScore', operator: 'GREATER_EQUAL', value: 0.70 },
    ],
    actions: [
      { type: 'EMIT_RECOMMENDATION' },
    ],
    evaluate: (ctx: RuleEvaluationContext): EvaluationOutcome => {
      const anomalies = ctx.deviceAnomalies || [];
      const highAnomaly = anomalies.find((a: any) => (a.anomalyScore || 0) >= 0.70);

      if (highAnomaly) {
        return {
          matched: true,
          reason: `Thiết bị ${highAnomaly.deviceName} có điểm bất thường ${(highAnomaly.anomalyScore * 100).toFixed(0)}%`,
          severity: highAnomaly.severity || 'WARNING',
          recommendation: {
            type: 'MAINTENANCE',
            title: `Bảo trì định kỳ: ${highAnomaly.deviceName} phòng ${ctx.roomNumber || ctx.roomId}`,
            description: highAnomaly.recommendation || `Mô hình AI phát hiện chỉ số bất thường trên thiết bị ${highAnomaly.deviceName}.`,
            reason: `Phát hiện bất thường từ Isolation Forest: ${JSON.stringify(highAnomaly.features || {})}`,
            recommendation: 'Cử nhân viên kỹ thuật kiểm tra và hiệu chuẩn thiết bị.',
            confidence: highAnomaly.anomalyScore,
            actions: [
              { type: 'NOTIFY_ADMIN', roomId: ctx.roomId, payload: { deviceId: highAnomaly.deviceId } },
            ],
            evidence: highAnomaly.evidence || highAnomaly.features,
          },
        };
      }
      return { matched: false };
    },
  },
];
