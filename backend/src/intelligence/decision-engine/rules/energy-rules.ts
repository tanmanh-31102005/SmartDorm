import { RuleConditionDto, RuleActionDto } from '../../dto/automation-rule.dto';

export interface DecisionEngineBuiltinRule {
  id: string;
  name: string;
  category: 'ENERGY' | 'OCCUPANCY' | 'DEVICE' | 'SECURITY' | 'SAFETY' | 'MAINTENANCE';
  priority: number; // 1 = highest (Safety), 100 = lowest
  cooldownMs: number;
  description: string;
  conditions: RuleConditionDto[];
  actions: RuleActionDto[];
  evaluate: (context: RuleEvaluationContext) => EvaluationOutcome;
}

export interface RuleEvaluationContext {
  roomId: string;
  buildingId?: string;
  roomNumber?: string;
  buildingName?: string;
  temperature?: number;
  humidity?: number;
  gasLevel?: number;
  gasAlert?: boolean;
  tempAlert?: boolean;
  motionDetected?: boolean;
  occupancyProbability?: number;
  predictedState?: 'OCCUPIED' | 'VACANT';
  vacantMinutes?: number;
  lightsOn?: boolean;
  fanOn?: boolean;
  doorLocked?: boolean;
  hourOfDay?: number;
  dayOfWeek?: number;
  deviceAnomalies?: any[];
  [key: string]: any;
}

export interface EvaluationOutcome {
  matched: boolean;
  reason?: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  recommendation?: {
    type: 'ENERGY' | 'DEVICE' | 'SECURITY' | 'OCCUPANCY' | 'MAINTENANCE';
    title: string;
    description: string;
    reason: string;
    recommendation: string;
    confidence: number;
    estimatedSavingsKwh?: number;
    actions: any[];
    evidence: Record<string, any>;
  };
  actionsToExecute?: RuleActionDto[];
}

export const CLIMATE_AUTOMATION_RULES: DecisionEngineBuiltinRule[] = [
  {
    id: 'builtin-energy-waste-detection',
    name: 'Phát hiện lãng phí điện năng phòng trống (AI Energy Waste Detection)',
    category: 'ENERGY',
    priority: 75,
    cooldownMs: 15 * 60 * 1000, // 15 phút
    description: 'Phát hiện sinh viên lên giảng đường quên tắt thiết bị điện, tính toán tổn thất và gửi thông báo tương tác',
    conditions: [
      { field: 'predictedState', operator: 'EQUALS', value: 'VACANT' },
      { field: 'powerW', operator: 'GREATER_THAN', value: 20.0 },
    ],
    actions: [
      { type: 'LIGHT_OFF' },
      { type: 'FAN_OFF' },
      { type: 'EMIT_RECOMMENDATION' },
    ],
    evaluate: (ctx: RuleEvaluationContext): EvaluationOutcome => {
      const isVacant = ctx.predictedState === 'VACANT' || (ctx.occupancyProbability !== undefined && ctx.occupancyProbability < 0.35);
      const isRunning = ctx.lightsOn || ctx.fanOn || (ctx.powerW !== undefined && ctx.powerW > 20.0);
      const vacantDurationOk = (ctx.vacantMinutes === undefined || ctx.vacantMinutes >= 15);

      if (isVacant && isRunning && vacantDurationOk) {
        const activeDevices: string[] = [];
        if (ctx.lightsOn) activeDevices.push('Đèn chiếu sáng (40W)');
        if (ctx.fanOn) activeDevices.push('Quạt thông gió (60W)');
        if (activeDevices.length === 0) activeDevices.push('Thiết bị điện phòng (50W)');

        const power = ctx.powerW || (ctx.lightsOn ? 40 : 0) + (ctx.fanOn ? 60 : 0) + 5;
        // Ước tính 4 tiếng sinh viên học trên giảng đường (4h * power / 1000 kWh)
        const estimatedLossKwh = Math.round((power * 4 / 1000) * 100) / 100;
        const estimatedCostVnd = Math.round(estimatedLossKwh * 2260);

        return {
          matched: true,
          reason: `Phòng ${ctx.roomNumber || ctx.roomId} không có người nhưng thiết bị đang bật tiêu thụ ${power.toFixed(0)}W`,
          severity: 'WARNING',
          recommendation: {
            type: 'ENERGY',
            title: `Cảnh báo lãng phí điện năng Phòng ${ctx.roomNumber || ctx.roomId}`,
            description: `Phát hiện phòng trống suốt ${ctx.vacantMinutes || 25} phút qua nhưng ${activeDevices.join(' & ')} vẫn đang hoạt động.`,
            reason: `Sinh viên đã rời phòng (RFID/AI xác nhận phòng trống). Dự kiến lãng phí ${estimatedLossKwh} kWh (${estimatedCostVnd.toLocaleString('vi-VN')} ₫/buổi học).`,
            recommendation: 'Đề xuất tắt thiết bị từ xa qua App hoặc Telegram để bảo toàn năng lượng và giảm hóa đơn KTX.',
            confidence: 0.95,
            estimatedSavingsKwh: estimatedLossKwh,
            actions: [
              { type: 'LIGHT_OFF', roomId: ctx.roomId },
              { type: 'FAN_OFF', roomId: ctx.roomId },
            ],
            evidence: {
              vacantMinutes: ctx.vacantMinutes || 25,
              activeDevices,
              powerW: power,
              estimatedLossKwh,
              estimatedCostVnd,
            },
          },
          actionsToExecute: [
            { type: 'LIGHT_OFF', targetRoomId: ctx.roomId },
            { type: 'FAN_OFF', targetRoomId: ctx.roomId },
          ],
        };
      }

      return { matched: false };
    },
  },
  {
    id: 'builtin-idle-room-device-off',
    name: 'Tự động tắt thiết bị khi phòng không có người (Idle Room Auto-Off)',
    category: 'DEVICE',
    priority: 80,
    cooldownMs: 15 * 60 * 1000, // 15 mins
    description: 'Đề xuất hoặc tự động tắt rơ-le đèn/quạt khi phòng không có người trong hơn 15 phút',
    conditions: [
      { field: 'predictedState', operator: 'EQUALS', value: 'VACANT' },
      { field: 'lightsOn', operator: 'EQUALS', value: true },
    ],
    actions: [
      { type: 'LIGHT_OFF' },
      { type: 'FAN_OFF' },
      { type: 'EMIT_RECOMMENDATION' },
    ],
    evaluate: (ctx: RuleEvaluationContext): EvaluationOutcome => {
      const isVacant = ctx.predictedState === 'VACANT' || (ctx.occupancyProbability !== undefined && ctx.occupancyProbability < 0.25);
      const isRunning = ctx.lightsOn || ctx.fanOn;
      const vacantDurationOk = (ctx.vacantMinutes === undefined || ctx.vacantMinutes >= 15);

      if (isVacant && isRunning && vacantDurationOk) {
        return {
          matched: true,
          reason: `Phòng ${ctx.roomNumber || ctx.roomId} không có người nhưng đèn/quạt đang bật`,
          severity: 'INFO',
          recommendation: {
            type: 'DEVICE',
            title: `Tối ưu thiết bị: Tắt rơ-le đèn/quạt phòng ${ctx.roomNumber || ctx.roomId}`,
            description: `Hệ thống phát hiện phòng trống trong hơn 15 phút nhưng đèn hoặc quạt vẫn đang hoạt động.`,
            reason: `Phòng trống (xác suất có người ${((ctx.occupancyProbability || 0.1) * 100).toFixed(0)}%) và không ghi nhận chuyển động.`,
            recommendation: 'Tắt rơ-le đèn và quạt để tối ưu tuổi thọ thiết bị phần cứng.',
            confidence: 0.94,
            actions: [
              { type: 'LIGHT_OFF', roomId: ctx.roomId },
              { type: 'FAN_OFF', roomId: ctx.roomId },
            ],
            evidence: {
              occupancyProbability: ctx.occupancyProbability,
              motionDetected: ctx.motionDetected,
              lightsOn: ctx.lightsOn,
              fanOn: ctx.fanOn,
            },
          },
          actionsToExecute: [
            { type: 'LIGHT_OFF', targetRoomId: ctx.roomId },
            { type: 'FAN_OFF', targetRoomId: ctx.roomId },
          ],
        };
      }

      return { matched: false };
    },
  },
  {
    id: 'builtin-climate-high-temperature-cooling',
    name: 'Cảnh báo nhiệt độ phòng cao (High Temperature Climate Alert)',
    category: 'DEVICE',
    priority: 65,
    cooldownMs: 20 * 60 * 1000, // 20 mins
    description: 'Phát hiện nhiệt độ DHT22 vượt ngưỡng 35°C và tự động bật quạt làm mát phòng',
    conditions: [
      { field: 'temperature', operator: 'GREATER_THAN', value: 35.0 },
    ],
    actions: [
      { type: 'FAN_ON' },
      { type: 'EMIT_RECOMMENDATION' },
    ],
    evaluate: (ctx: RuleEvaluationContext): EvaluationOutcome => {
      const temp = ctx.temperature || 0;
      if (temp >= 35.0) {
        return {
          matched: true,
          reason: `Nhiệt độ DHT22 đo được ${temp.toFixed(1)}°C vượt ngưỡng thoáng khí (35°C)`,
          severity: temp > 38.0 ? 'CRITICAL' : 'WARNING',
          recommendation: {
            type: 'DEVICE',
            title: `Cảnh báo nhiệt độ cao phòng ${ctx.roomNumber || ctx.roomId} (${temp.toFixed(1)}°C)`,
            description: `Nhiệt độ cảm biến DHT22 đang ở mức cao. Đề xuất bật quạt thông gió để bảo đảm điều kiện vi khí hậu phòng sinh viên.`,
            reason: `Cảm biến DHT22 đo đạc vượt ngưỡng nhiệt độ khuyến nghị 35°C.`,
            recommendation: 'Bật rơ-le quạt làm mát và mở cửa thông gió.',
            confidence: 0.98,
            evidence: {
              temperature: temp,
              humidity: ctx.humidity,
              threshold: 35.0,
            },
            actions: [
              { type: 'FAN_ON', roomId: ctx.roomId },
            ],
          },
          actionsToExecute: [
            { type: 'FAN_ON', targetRoomId: ctx.roomId },
          ],
        };
      }
      return { matched: false };
    },
  },
];

// Backward-compatibility alias
export const ENERGY_RULES = CLIMATE_AUTOMATION_RULES;
