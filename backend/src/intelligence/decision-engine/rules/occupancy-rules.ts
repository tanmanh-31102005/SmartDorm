import { DecisionEngineBuiltinRule, RuleEvaluationContext, EvaluationOutcome } from './energy-rules';

export const OCCUPANCY_RULES: DecisionEngineBuiltinRule[] = [
  {
    id: 'builtin-occupancy-vacant-lights-off',
    name: 'Tự động tắt đèn sau khi phòng trống (Auto Lights Off on Vacancy)',
    category: 'OCCUPANCY',
    priority: 50, // Operational Automation level
    cooldownMs: 10 * 60 * 1000, // 10 mins cooldown
    description: 'Tự động tắt hệ thống chiếu sáng khi cảm biến chuyển động không ghi nhận hoạt động và xác suất có người < 15%',
    conditions: [
      { field: 'motionDetected', operator: 'EQUALS', value: false },
      { field: 'occupancyProbability', operator: 'LESS_THAN', value: 0.15 },
      { field: 'lightsOn', operator: 'EQUALS', value: true },
    ],
    actions: [
      { type: 'LIGHT_OFF' },
      { type: 'EMIT_RECOMMENDATION' },
    ],
    evaluate: (ctx: RuleEvaluationContext): EvaluationOutcome => {
      const noMotion = ctx.motionDetected === false;
      const lowOccupancy = (ctx.occupancyProbability !== undefined ? ctx.occupancyProbability : 0) < 0.15;
      const lightsAreOn = ctx.lightsOn === true;

      if (noMotion && lowOccupancy && lightsAreOn) {
        return {
          matched: true,
          reason: `Phòng ${ctx.roomNumber || ctx.roomId} không phát hiện chuyển động, xác suất có người ${( (ctx.occupancyProbability || 0) * 100).toFixed(0)}%, nhưng đèn đang bật.`,
          severity: 'INFO',
          recommendation: {
            type: 'OCCUPANCY',
            title: `Tối ưu tự động: Tắt đèn phòng ${ctx.roomNumber || ctx.roomId}`,
            description: `Không có sinh viên trong phòng nhưng đèn vẫn đang bật. Đề xuất tắt đèn tự động.`,
            reason: `Cảm biến PIR không phát hiện chuyển động và mô hình AI dự báo phòng trống.`,
            recommendation: 'Tắt đèn chiếu sáng để bảo vệ tuổi thọ bóng LED.',
            confidence: 0.95,
            estimatedSavingsKwh: 0.06,
            actions: [{ type: 'LIGHT_OFF', roomId: ctx.roomId }],
            evidence: {
              motionDetected: ctx.motionDetected,
              occupancyProbability: ctx.occupancyProbability,
              lightsOn: ctx.lightsOn,
            },
          },
          actionsToExecute: [
            { type: 'LIGHT_OFF', targetRoomId: ctx.roomId },
          ],
        };
      }
      return { matched: false };
    },
  },
  {
    id: 'builtin-occupancy-night-curfew-lights',
    name: 'Kiểm soát đèn sau giờ giới nghiêm (Night Curfew Lights Check)',
    category: 'OCCUPANCY',
    priority: 60,
    cooldownMs: 60 * 60 * 1000, // 1 hour
    description: 'Cảnh báo hoặc tắt đèn hành lang / phòng sinh hoạt chung sau 23:30',
    conditions: [
      { field: 'hourOfDay', operator: 'GREATER_EQUAL', value: 23 },
      { field: 'lightsOn', operator: 'EQUALS', value: true },
    ],
    actions: [
      { type: 'EMIT_RECOMMENDATION' },
    ],
    evaluate: (ctx: RuleEvaluationContext): EvaluationOutcome => {
      const hour = ctx.hourOfDay !== undefined ? ctx.hourOfDay : new Date().getHours();
      const isLateNight = hour >= 23 || hour < 5;
      const isVacant = ctx.predictedState === 'VACANT' || (ctx.occupancyProbability !== undefined && ctx.occupancyProbability < 0.2);

      if (isLateNight && isVacant && ctx.lightsOn) {
        return {
          matched: true,
          reason: `Sau giờ giới nghiêm (${hour}h), phòng trống nhưng vẫn bật đèn sáng.`,
          severity: 'WARNING',
          recommendation: {
            type: 'OCCUPANCY',
            title: `Tắt đèn đêm khuya phòng ${ctx.roomNumber || ctx.roomId}`,
            description: `Phát hiện đèn sáng sau 23:00 tại phòng trống. Đề xuất tắt đèn để tuân thủ nội quy ký túc xá.`,
            reason: `Khung giờ giới nghiêm ban đêm kết hợp phòng trống.`,
            recommendation: 'Tắt đèn phòng sinh viên.',
            confidence: 0.97,
            estimatedSavingsKwh: 0.18,
            actions: [{ type: 'LIGHT_OFF', roomId: ctx.roomId }],
            evidence: {
              hourOfDay: hour,
              lightsOn: ctx.lightsOn,
              predictedState: ctx.predictedState,
            },
          },
          actionsToExecute: [
            { type: 'LIGHT_OFF', targetRoomId: ctx.roomId },
          ],
        };
      }
      return { matched: false };
    },
  },
];
