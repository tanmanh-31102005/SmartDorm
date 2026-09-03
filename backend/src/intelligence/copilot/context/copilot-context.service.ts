import { Injectable } from '@nestjs/common';
import { CopilotToolsService, GroundedToolResult } from '../tools/copilot-tools.service';
import { CopilotIntent, CopilotQueryContextDto, DataSourceType } from '../dto/copilot.dto';

export interface GroundedContextPackage {
  intent: CopilotIntent;
  userMessage: string;
  toolResults: GroundedToolResult[];
  dataSources: string[];
  dataSourceType: DataSourceType;
  privacyNotice?: string;
  isSafetyOverrideAttempt: boolean;
  contextSummary: Record<string, any>;
}

@Injectable()
export class CopilotContextService {
  constructor(private readonly toolsService: CopilotToolsService) {}

  /**
   * 1. Intent Router: Maps natural language query to precise system intent
   */
  routeIntent(message?: string): CopilotIntent {
    const text = (message || '').toLowerCase();

    // Check for safety override attempts / hardware control requests
    if (
      text.includes('unlock') ||
      text.includes('mở tất cả cửa') ||
      text.includes('mở cửa tự do') ||
      text.includes('tắt báo cháy') ||
      text.includes('disable alarm') ||
      text.includes('disable gas') ||
      text.includes('tắt còi hú') ||
      text.includes('override safety') ||
      text.includes('gửi lệnh mqtt') ||
      text.includes('bỏ qua an toàn')
    ) {
      return 'SAFETY_OVERRIDE_ATTEMPT';
    }

    // Check AI / ML Model Health & Drift
    if (
      text.includes('model') ||
      text.includes('mô hình') ||
      text.includes('drift') ||
      text.includes('sức khỏe ai') ||
      text.includes('mae') ||
      text.includes('retrain') ||
      text.includes('độ chính xác')
    ) {
      return 'MODEL_HEALTH';
    }

    // Check Forecast & Future Peak Loads
    if (
      text.includes('dự báo') ||
      text.includes('phụ tải') ||
      text.includes('tối nay') ||
      text.includes('ngày mai') ||
      text.includes('forecast') ||
      text.includes('lstm') ||
      text.includes('đỉnh điện')
    ) {
      return 'ENERGY_FORECAST';
    }

    // Check Security & RFID Access
    if (
      text.includes('quẹt thẻ') ||
      text.includes('rfid') ||
      text.includes('ra vào') ||
      text.includes('xâm nhập') ||
      text.includes('access log') ||
      text.includes('an ninh')
    ) {
      return 'SECURITY_ACCESS';
    }

    // Check Device Anomalies & Faults
    if (
      text.includes('dị thường') ||
      text.includes('bất thường') ||
      text.includes('cảnh báo') ||
      text.includes('hỏng') ||
      text.includes('kẹt tiếp điểm') ||
      text.includes('kẹt máy nén') ||
      text.includes('isolation forest') ||
      text.includes('quá nhiệt')
    ) {
      return 'DEVICE_ANOMALY';
    }

    // Check Occupancy & Presence
    if (
      text.includes('sinh viên') ||
      text.includes('có mặt') ||
      text.includes('lưu trú') ||
      text.includes('hiện diện') ||
      text.includes('phòng trống') ||
      text.includes('occupancy')
    ) {
      return 'OCCUPANCY_PREDICTION';
    }

    // Check Environment / Vi khí hậu
    if (
      text.includes('nhiệt độ') ||
      text.includes('độ ẩm') ||
      text.includes('khí gas') ||
      text.includes('mq-2') ||
      text.includes('dht22') ||
      text.includes('môi trường') ||
      text.includes('vi khí hậu') ||
      text.includes('cháy')
    ) {
      return 'ROOM_ENVIRONMENT';
    }

    // Check Recommendations
    if (
      text.includes('khuyến nghị') ||
      text.includes('gợi ý') ||
      text.includes('tiết kiệm') ||
      text.includes('pre-cooling') ||
      text.includes('mẹo')
    ) {
      return 'RECOMMENDATIONS';
    }

    // Check Monthly Billing & Electricity Cost
    if (
      text.includes('tiền điện') ||
      text.includes('hóa đơn') ||
      text.includes('bao nhiêu tiền') ||
      text.includes('đóng tiền') ||
      text.includes('đơn giá') ||
      text.includes('chia tiền') ||
      text.includes('bậc thang') ||
      text.includes('tháng này hết bao nhiêu')
    ) {
      return 'MONTHLY_BILLING';
    }

    // Check Settings, Thresholds & Notifications
    if (
      text.includes('ngưỡng') ||
      text.includes('cài đặt') ||
      text.includes('cấu hình') ||
      text.includes('telegram') ||
      text.includes('email') ||
      text.includes('báo cháy ở mức') ||
      text.includes('quy tắc an toàn')
    ) {
      return 'SYSTEM_SETTINGS_THRESHOLDS';
    }

    // Check Energy Consumption
    if (
      text.includes('điện') ||
      text.includes('kwh') ||
      text.includes('công suất') ||
      text.includes('năng lượng') ||
      text.includes('tốn kém')
    ) {
      return 'ENERGY_ANALYSIS';
    }

    // Check System Telemetry Status
    if (
      text.includes('hệ thống') ||
      text.includes('wokwi') ||
      text.includes('mqtt') ||
      text.includes('kết nối') ||
      text.includes('sensor')
    ) {
      return 'SYSTEM_STATUS';
    }

    return 'GENERAL_INQUIRY';
  }

  /**
   * 2. Context Builder: Executes selected grounded tools, strictly enforces RBAC scoping for Students, and compiles factual context.
   */
  async buildGroundedContext(
    userMessage?: string,
    ctx?: CopilotQueryContextDto,
  ): Promise<GroundedContextPackage> {
    const safeMessage = userMessage || '';
    const intent = this.routeIntent(safeMessage);
    const toolResults: GroundedToolResult[] = [];
    const isStudent = ctx?.role === 'STUDENT';
    const studentRoom = ctx?.roomNumber || 'A101';

    // Extract potential room targets (e.g. "B204", "A101", "P.102", "102")
    const roomMatch = safeMessage.match(/\b([ABCabc]\s*[-_.]?\s*\d{3}|\d{3})\b/);
    const extractedRoom = roomMatch ? roomMatch[0].replace(/\s+/g, '').toUpperCase() : null;
    const requestedRoom = isStudent ? studentRoom : (extractedRoom || studentRoom);

    // 1. Handle Safety Override Attempt Immediately
    if (intent === 'SAFETY_OVERRIDE_ATTEMPT') {
      return {
        intent,
        userMessage: safeMessage,
        toolResults: [],
        dataSources: ['SAFETY_POLICY_ENGINE'],
        dataSourceType: 'SYSTEM_RULE_ENGINE',
        isSafetyOverrideAttempt: true,
        contextSummary: {
          safetyViolation: true,
          reason: 'SmartDorm AI Copilot là tầng tư vấn và trợ lý thông minh (Read-Only). Hệ thống không có thẩm quyền bỏ qua quy tắc an toàn PCCC hoặc gửi lệnh điều khiển phần cứng MQTT trực tiếp.',
        },
      };
    }

    // 2. Strict Student RBAC Privacy Gating
    if (isStudent) {
      // If student specifically queries another room (e.g. "phòng B204", "phòng 204")
      if (extractedRoom && !extractedRoom.includes(studentRoom.toUpperCase())) {
        return {
          intent,
          userMessage: safeMessage,
          toolResults: [],
          dataSources: ['RBAC_SECURITY_FILTER'],
          dataSourceType: 'DATABASE',
          privacyNotice: `Bảo mật thông tin: Bạn chỉ được quyền xem số liệu phòng của bạn (${studentRoom}). Không thể truy cập phòng ${extractedRoom}.`,
          isSafetyOverrideAttempt: false,
          contextSummary: {
            accessDenied: true,
            userRole: 'STUDENT',
            authorizedRoom: studentRoom,
            requestedTarget: extractedRoom,
          },
        };
      }

      // If student queries campus-wide data or admin-only intelligence domains
      const textLower = safeMessage.toLowerCase();
      const isCampusOrAdminQuery =
        textLower.includes('toàn trường') ||
        textLower.includes('toàn campus') ||
        textLower.includes('cả trường') ||
        textLower.includes('toàn ktx') ||
        textLower.includes('tất cả các phòng') ||
        textLower.includes('phòng trống') ||
        textLower.includes('danh sách phòng') ||
        intent === 'MODEL_HEALTH' ||
        intent === 'DEVICE_ANOMALY' ||
        intent === 'OCCUPANCY_PREDICTION' ||
        intent === 'SYSTEM_STATUS';

      if (isCampusOrAdminQuery) {
        return {
          intent,
          userMessage: safeMessage,
          toolResults: [],
          dataSources: ['RBAC_SECURITY_FILTER'],
          dataSourceType: 'DATABASE',
          privacyNotice: `Bảo mật thông tin (RBAC): Bạn đang đăng nhập với quyền Sinh viên nên chỉ có thể tra cứu thông tin phòng của bạn (${studentRoom}). Số liệu tổng hợp toàn campus và các phân tích quản trị chỉ dành cho Ban Quản Lý.`,
          isSafetyOverrideAttempt: false,
          contextSummary: {
            accessDenied: true,
            userRole: 'STUDENT',
            authorizedRoom: studentRoom,
            reason: 'CAMPUS_WIDE_DATA_RESTRICTED_FOR_STUDENT',
          },
        };
      }
    }

    // 3. Dispatch Grounded Tools according to Intent & Scope
    switch (intent) {
      case 'ENERGY_FORECAST': {
        if (isStudent) {
          const roomEnergy = await this.toolsService.getRoomEnergy(studentRoom, ctx);
          toolResults.push(roomEnergy);
        } else {
          const forecastRes = await this.toolsService.getEnergyForecast(safeMessage.includes('7') ? '7d' : '24h', ctx);
          toolResults.push(forecastRes);
        }
        break;
      }
      case 'DEVICE_ANOMALY': {
        const anomalyRes = await this.toolsService.getEnergyAnomalies(ctx);
        toolResults.push(anomalyRes);
        break;
      }
      case 'ROOM_ENVIRONMENT': {
        const envRes = await this.toolsService.getRoomEnvironment(requestedRoom, ctx);
        toolResults.push(envRes);
        break;
      }
      case 'OCCUPANCY_PREDICTION': {
        const occRes = await this.toolsService.getOccupancyPrediction(ctx);
        toolResults.push(occRes);
        break;
      }
      case 'MODEL_HEALTH': {
        const modelRes = await this.toolsService.getModelHealth(ctx);
        toolResults.push(modelRes);
        break;
      }
      case 'SECURITY_ACCESS': {
        const accessRes = await this.toolsService.getAccessLogs(ctx);
        const secRes = await this.toolsService.getSecurityEvents(ctx);
        toolResults.push(accessRes, secRes);
        break;
      }
      case 'RECOMMENDATIONS': {
        if (isStudent) {
          const roomEnergy = await this.toolsService.getRoomEnergy(studentRoom, ctx);
          toolResults.push(roomEnergy);
        } else {
          const recRes = await this.toolsService.getRecommendations(ctx);
          toolResults.push(recRes);
        }
        break;
      }
      case 'MONTHLY_BILLING': {
        const billRes = await this.toolsService.getMonthlyBilling(requestedRoom, ctx);
        toolResults.push(billRes);
        break;
      }
      case 'SYSTEM_SETTINGS_THRESHOLDS': {
        const setRes = await this.toolsService.getSystemSettingsAndThresholds(ctx);
        toolResults.push(setRes);
        break;
      }
      case 'ENERGY_ANALYSIS': {
        if (isStudent || safeMessage.toLowerCase().includes('phòng')) {
          const roomEnergy = await this.toolsService.getRoomEnergy(requestedRoom, ctx);
          toolResults.push(roomEnergy);
        } else {
          const campusEnergy = await this.toolsService.getCurrentEnergy(ctx);
          toolResults.push(campusEnergy);
        }
        break;
      }
      case 'SYSTEM_STATUS': {
        const sysRes = await this.toolsService.getSystemStatus(ctx);
        const sensorRes = await this.toolsService.getSensorStatus(ctx);
        toolResults.push(sysRes, sensorRes);
        break;
      }
      default: {
        if (isStudent) {
          const roomEnergy = await this.toolsService.getRoomEnergy(studentRoom, ctx);
          toolResults.push(roomEnergy);
        } else {
          const sysRes = await this.toolsService.getSystemStatus(ctx);
          toolResults.push(sysRes);
        }
        break;
      }
    }

    // Collect all data sources and check privacy violations
    const allSources = Array.from(new Set(toolResults.flatMap(t => t.dataSources)));
    const privacyNotice = toolResults.find(t => t.privacyNotice)?.privacyNotice;
    const dominantSourceType = toolResults[0]?.dataSourceType || 'DATABASE';

    return {
      intent,
      userMessage: safeMessage,
      toolResults,
      dataSources: allSources,
      dataSourceType: dominantSourceType,
      privacyNotice,
      isSafetyOverrideAttempt: false,
      contextSummary: {
        intent,
        requestedTarget: requestedRoom,
        authorizedRoom: studentRoom,
        userRole: ctx?.role || 'ADMIN',
        timestamp: new Date().toISOString(),
        facts: toolResults.map(t => ({ tool: t.toolName, data: t.payload })),
      },
    };
  }
}
