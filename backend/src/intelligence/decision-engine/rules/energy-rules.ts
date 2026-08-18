import { RuleConditionDto, RuleActionDto } from '../../dto/automation-rule.dto';

export interface DecisionEngineBuiltinRule {
  id: string;
  name: string;
  category: 'ENERGY' | 'OCCUPANCY' | 'DEVICE' | 'SECURITY' | 'SAFETY' | 'MAINTENANCE';
  priority: number; // 1 = highest (Safety), 100 = lowest (Energy)
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
  powerW?: number;
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

export const ENERGY_RULES: DecisionEngineBuiltinRule[] = [
  {
    id: 'builtin-energy-idle-room-power-off',
    name: 'Tắt thiết bị khi phòng không có người (Idle Room Power Off)',
    category: 'ENERGY',
    priority: 80, // Energy Optimization level
    cooldownMs: 15 * 60 * 1000, // 15 mins
    description: 'Đề xuất hoặc tự động tắt đèn/quạt khi phòng không có người trong hơn 15 phút mà vẫn tiêu thụ điện',
    conditions: [
      { field: 'predictedState', operator: 'EQUALS', value: 'VACANT' },
      { field: 'powerW', operator: 'GREATER_THAN', value: 25.0 },
    ],
    actions: [
      { type: 'LIGHT_OFF' },
      { type: 'FAN_OFF' },
      { type: 'EMIT_RECOMMENDATION' },
    ],
    evaluate: (ctx: RuleEvaluationContext): EvaluationOutcome => {
      const isVacant = ctx.predictedState === 'VACANT' || (ctx.occupancyProbability !== undefined && ctx.occupancyProbability < 0.25);
      const isDrawingPower = (ctx.powerW || 0) > 25.0 || ctx.lightsOn || ctx.fanOn;
      const vacantDurationOk = (ctx.vacantMinutes === undefined || ctx.vacantMinutes >= 15);

      if (isVacant && isDrawingPower && vacantDurationOk) {
        const powerW = ctx.powerW || 60.0;
        const estSavingsKwh = Math.round((powerW / 1000.0) * 100) / 100;

        return {
          matched: true,
          reason: `Phòng ${ctx.roomNumber || ctx.roomId} không có người nhưng đang bật thiết bị tiêu thụ ${powerW}W`,
          severity: 'WARNING',
          recommendation: {
            type: 'ENERGY',
            title: `Tiết kiệm điện: Tắt thiết bị phòng ${ctx.roomNumber || ctx.roomId}`,
            description: `Hệ thống phát hiện phòng trống trong hơn 15 phút nhưng đèn/quạt vẫn hoạt động (công suất ${powerW}W).`,
            reason: `Phòng trống (xác suất có người ${( (ctx.occupancyProbability || 0.1) * 100).toFixed(0)}%) và không có chuyển động.`,
            recommendation: 'Tắt đèn và quạt để tránh lãng phí năng lượng.',
            confidence: 0.93,
            estimatedSavingsKwh: estSavingsKwh,
            actions: [
              { type: 'LIGHT_OFF', roomId: ctx.roomId },
              { type: 'FAN_OFF', roomId: ctx.roomId },
            ],
            evidence: {
              powerW,
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
    id: 'builtin-energy-high-consumption-spike',
    name: 'Cảnh báo đột biến tiêu thụ điện năng (High Consumption Spike)',
    category: 'ENERGY',
    priority: 65,
    cooldownMs: 30 * 60 * 1000, // 30 mins
    description: 'Phát hiện công suất tiêu thụ vượt ngưỡng bất thường (>300W cho 1 phòng ký túc xá)',
    conditions: [
      { field: 'powerW', operator: 'GREATER_THAN', value: 300.0 },
    ],
    actions: [
      { type: 'EMIT_RECOMMENDATION' },
      { type: 'NOTIFY_ADMIN' },
    ],
    evaluate: (ctx: RuleEvaluationContext): EvaluationOutcome => {
      const powerW = ctx.powerW || 0;
      if (powerW > 300.0) {
        return {
          matched: true,
          reason: `Công suất tiêu thụ đạt ${powerW}W vượt quá ngưỡng chuẩn (300W)`,
          severity: powerW > 600 ? 'CRITICAL' : 'WARNING',
          recommendation: {
            type: 'ENERGY',
            title: `Cảnh báo điện năng cao bất thường phòng ${ctx.roomNumber || ctx.roomId}`,
            description: `Công suất đo được là ${powerW}W, vượt 200% so với mức trung bình của phòng sinh viên. Nghi vấn sử dụng thiết bị công suất lớn trái phép (bếp từ, ấm siêu tốc).`,
            reason: `Đo lường thời gian thực từ cảm biến năng lượng vượt ngưỡng cho phép 300W.`,
            recommendation: 'Cán bộ quản lý phòng ký túc xá kiểm tra trực tiếp an toàn điện tại phòng.',
            confidence: 0.96,
            evidence: {
              powerW,
              threshold: 300.0,
              temperature: ctx.temperature,
            },
            actions: [
              { type: 'NOTIFY_ADMIN', roomId: ctx.roomId, payload: { message: `Công suất ${powerW}W tại phòng ${ctx.roomNumber}` } },
            ],
          },
        };
      }
      return { matched: false };
    },
  },
];
