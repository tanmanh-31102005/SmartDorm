import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController, AutomationController } from './intelligence.controller';
import { MlClientService } from './ml-client/ml-client.service';
import { RuleEngineService } from './decision-engine/rule-engine.service';
import { DecisionEngineService } from './decision-engine/decision-engine.service';
import { RecommendationService } from './recommendation/recommendation.service';
import { AutomationService } from './automation/automation.service';
import { LlmService } from './llm/llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { MqttService } from '../mqtt/mqtt.service';
import { CommandInvokerService } from '../devices/commands/command-invoker.service';
import { DevicesService } from '../devices/devices.service';

describe('Intelligence & Automation Layer (NestJS)', () => {
  let intelligenceService: IntelligenceService;
  let mlClientService: MlClientService;
  let ruleEngineService: RuleEngineService;
  let recommendationService: RecommendationService;
  let automationService: AutomationService;
  let decisionEngineService: DecisionEngineService;
  let llmService: LlmService;
  let intelligenceController: IntelligenceController;
  let automationController: AutomationController;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'student-1', roomId: 'room-101' }),
    },
    room: {
      count: jest.fn().mockResolvedValue(12),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'room-101',
          roomNumber: '101',
          floor: 1,
          buildingId: 'bldg-a',
          building: { id: 'bldg-a', name: 'Tòa A' },
          devices: [
            { id: 'dev-light-1', name: 'Đèn 1', type: 'LIGHT', isOn: true },
            { id: 'dev-fan-1', name: 'Quạt 1', type: 'FAN', isOn: false },
          ],
          sensorData: [
            {
              temperature: 28.5,
              humidity: 65,
              gasLevel: 35,
              gasAlert: false,
              tempAlert: false,
              motionDetected: true,
              recordedAt: new Date(),
            },
          ],
        },
      ]),
      findUnique: jest.fn().mockResolvedValue({
        id: 'room-101',
        roomNumber: '101',
        floor: 1,
        building: { name: 'Tòa A' },
        devices: [{ id: 'dev-1', isOn: true }],
      }),
      findFirst: jest.fn().mockResolvedValue({
        id: 'room-101',
        roomNumber: '101',
        floor: 1,
        building: { name: 'Tòa A' },
        devices: [{ id: 'dev-1', isOn: true }],
      }),
    },
    device: {
      count: jest.fn().mockResolvedValue(8),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    deviceAnomaly: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'anom-1',
          deviceId: 'dev-light-1',
          deviceName: 'Đèn 1',
          roomId: 'room-101',
          anomalyScore: 0.85,
          severity: 'HIGH',
          features: JSON.stringify({ powerW: 95 }),
          status: 'OPEN',
          recommendation: 'Kiểm tra driver LED',
          detectedAt: new Date(),
        },
      ]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'anom-new', ...args.data })),
    },
    aiRecommendation: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'rec-1',
          type: 'ENERGY',
          severity: 'WARNING',
          title: 'Tắt thiết bị phòng trống',
          description: 'Phòng 101 trống hơn 15 phút',
          location: 'room-101',
          reason: 'Không có chuyển động',
          recommendation: 'Tắt đèn và quạt',
          confidence: 0.92,
          evidence: JSON.stringify({ powerW: 80, actions: [{ type: 'LIGHT_OFF', roomId: 'room-101' }] }),
          status: 'PENDING',
          createdAt: new Date(),
        },
      ]),
      findUnique: jest.fn().mockResolvedValue({
        id: 'rec-1',
        type: 'ENERGY',
        severity: 'WARNING',
        title: 'Tắt thiết bị phòng trống',
        description: 'Phòng 101 trống',
        location: 'room-101',
        reason: 'Không có chuyển động',
        recommendation: 'Tắt đèn',
        status: 'PENDING',
        evidence: JSON.stringify({ actions: [{ type: 'LIGHT_OFF', targetRoomId: 'room-101' }] }),
        createdAt: new Date(),
      }),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'rec-new', ...args.data })),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, ...args.data })),
    },
    automationRule: {
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'rule-1',
          name: 'Auto Night Light Off',
          conditions: JSON.stringify([{ field: 'hourOfDay', operator: 'GREATER_EQUAL', value: 23 }]),
          actions: JSON.stringify([{ type: 'LIGHT_OFF' }]),
          priority: 50,
          enabled: true,
          cooldownMs: 300000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      findUnique: jest.fn().mockResolvedValue({
        id: 'rule-1',
        name: 'Auto Night Light Off',
        conditions: JSON.stringify([{ field: 'hourOfDay', operator: 'GREATER_EQUAL', value: 23 }]),
        actions: JSON.stringify([{ type: 'LIGHT_OFF' }]),
        priority: 50,
        enabled: true,
        cooldownMs: 300000,
      }),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'rule-new', ...args.data })),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, ...args.data })),
    },
    automationExecution: {
      create: jest.fn().mockResolvedValue({ id: 'exec-1' }),
    },
    sensorData: {
      findMany: jest.fn().mockResolvedValue([
        { recordedAt: new Date(Date.now() - 3600 * 1000), temperature: 28, humidity: 60, gasLevel: 30 },
      ]),
    },
  };

  const mockEventsGateway = {
    broadcastAiAnomaly: jest.fn(),
    broadcastAiRecommendation: jest.fn(),
    broadcastAiModelUpdate: jest.fn(),
    broadcastAiForecast: jest.fn(),
    broadcastDeviceStatus: jest.fn(),
    server: { emit: jest.fn() },
  };

  const mockMqttService = {
    on: jest.fn(),
    publish: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true),
  };

  const mockCommandInvoker = {
    executeCommand: jest.fn().mockResolvedValue({ success: true, commandType: 'TurnOffLight' }),
    getHistory: jest.fn().mockResolvedValue([]),
    undoLastCommand: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockDevicesService = {
    sendCommand: jest.fn().mockResolvedValue({ success: true, commandType: 'TurnOffLight', isOn: false }),
    getDevicesByRoom: jest.fn().mockResolvedValue([]),
    undoLastCommand: jest.fn().mockResolvedValue({ success: true }),
    getCommandHistory: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (url: any, opts: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        let textResponse = 'AI phát hiện thiết bị FAN-B204 tại phòng 204 ăn dòng 135W vượt định mức, nguy cơ kẹt trục bạc đạn. Khuyến nghị kiểm tra rơ-le và motor quạt.';
        try {
          const body = JSON.parse(opts?.body || '{}');
          const prompt = body?.contents?.[0]?.parts?.[0]?.text || '';
          if (prompt.includes('Green Dorm Buddy') || prompt.includes('phòng 101')) {
            textResponse = 'Tuyệt vời! Phòng 101 đang tiết kiệm được 8% điện so với tuần trước. Hãy duy trì thói quen hẹn giờ tắt điều hòa lúc 03:00 sáng nhé!';
          }
        } catch {}

        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: textResponse,
                    },
                  ],
                },
              },
            ],
          }),
        } as any;
      }

      // Return offline status for ML Service so fallback triggers immediately in tests
      return { ok: false, status: 503, json: async () => ({ error: 'Service Unavailable' }) } as any;
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntelligenceController, AutomationController],
      providers: [
        IntelligenceService,
        MlClientService,
        RuleEngineService,
        DecisionEngineService,
        RecommendationService,
        AutomationService,
        LlmService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: MqttService, useValue: mockMqttService },
        { provide: CommandInvokerService, useValue: mockCommandInvoker },
        { provide: DevicesService, useValue: mockDevicesService },
      ],
    }).compile();

    intelligenceService = module.get<IntelligenceService>(IntelligenceService);
    mlClientService = module.get<MlClientService>(MlClientService);
    ruleEngineService = module.get<RuleEngineService>(RuleEngineService);
    recommendationService = module.get<RecommendationService>(RecommendationService);
    automationService = module.get<AutomationService>(AutomationService);
    decisionEngineService = module.get<DecisionEngineService>(DecisionEngineService);
    llmService = module.get<LlmService>(LlmService);
    intelligenceController = module.get<IntelligenceController>(IntelligenceController);
    automationController = module.get<AutomationController>(AutomationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. ML Client Graceful Fallback & Multi-Model System', () => {
    it('should generate baseline 24-hour energy forecast when FastAPI is offline', async () => {
      const forecast = await mlClientService.predictEnergyForecast({ horizonHours: 24 });
      expect(forecast).toBeDefined();
      expect(forecast.points.length).toBe(24);
      expect(['BASELINE_PROXY', 'FASTAPI_PROPHET', 'GBM_MULTIVARIATE_CHAMPION']).toContain(forecast.source);
      expect(forecast.summary.totalForecastKwh).toBeGreaterThan(0);
      expect(forecast.points[0]).toHaveProperty('forecastPowerW');
      expect(forecast.points[0]).toHaveProperty('confidence');
    });

    it('should generate LSTM forecast with valid confidence bounds', async () => {
      const lstmForecast = await mlClientService.predictLstmForecast({ horizonHours: 24 });
      expect(lstmForecast).toBeDefined();
      expect(lstmForecast.points.length).toBe(24);
      expect(lstmForecast.summary.totalForecastKwh).toBeGreaterThan(0);
    });

    it('should perform Champion GBM forecast verification', async () => {
      const comparison = await mlClientService.compareForecastModels({ horizonHours: 24 });
      expect(comparison).toBeDefined();
      expect(comparison.models.length).toBe(1);
      expect(comparison.timeline.length).toBe(24);
      expect(comparison.timeline[0]).toHaveProperty('gbmPowerW');
    });

    it('should report model health metadata for all 3 models', async () => {
      const models = await mlClientService.getModelHealthList();
      expect(models.length).toBe(3);
      expect(models.map(m => m.type)).toContain('FORECAST');
      expect(models.map(m => m.type)).toContain('ANOMALY');
      expect(models.map(m => m.type)).toContain('OCCUPANCY');
    });

    it('should check model drift and staleness', async () => {
      const drift = await mlClientService.checkModelDrift();
      expect(Array.isArray(drift)).toBe(true);
      expect(drift.length).toBeGreaterThanOrEqual(2);
      expect(drift[0]).toHaveProperty('isStale');
      expect(drift[0]).toHaveProperty('isDriftDetected');
    });
  });

  describe('2. External LLM Explainability & Privacy', () => {
    it('should generate natural Vietnamese explanation for device anomaly without hardware control', async () => {
      const explanation = await llmService.explainDeviceAnomaly({
        deviceName: 'FAN-B204',
        deviceType: 'FAN',
        roomNumber: '204',
        buildingName: 'B',
        powerW: 135.0,
        responseMs: 380,
        failureRate: 0.12,
        severity: 'HIGH',
        anomalyScore: 0.88,
      });

      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(20);
      expect(explanation).toContain('FAN-B204');
    });

    it('should generate personalized eco tip for student room', async () => {
      const tip = await llmService.generateStudentEcoTip('101', 8.4, 9.1);
      expect(typeof tip).toBe('string');
      expect(tip.length).toBeGreaterThan(15);
      expect(tip).toContain('101');
    });

    it('should provide scoped student insights without leaking other rooms data', async () => {
      const insights = await intelligenceService.getStudentInsights('student-1', 'room-101');
      expect(insights).toBeDefined();
      expect(insights.room.roomNumber).toBe('101');
      expect(insights.forecastTomorrow).toBeDefined();
      expect(insights.aiInsights.ecoTip).toBeDefined();
      expect(insights.privacyNotice).toBeDefined();
    });
  });

  describe('3. Rule Engine & Safety Precedence', () => {
    it('should evaluate condition operators correctly', () => {
      const ctx = {
        roomId: 'room-101',
        temperature: 32.5,
        motionDetected: false,
        powerW: 120,
        status: 'ACTIVE',
      };

      expect(ruleEngineService.evaluateSingleCondition({ field: 'temperature', operator: 'GREATER_THAN', value: 30 }, ctx)).toBe(true);
      expect(ruleEngineService.evaluateSingleCondition({ field: 'temperature', operator: 'LESS_THAN', value: 20 }, ctx)).toBe(false);
      expect(ruleEngineService.evaluateSingleCondition({ field: 'motionDetected', operator: 'EQUALS', value: false }, ctx)).toBe(true);
      expect(ruleEngineService.evaluateSingleCondition({ field: 'powerW', operator: 'GREATER_EQUAL', value: 120 }, ctx)).toBe(true);
      expect(ruleEngineService.evaluateSingleCondition({ field: 'status', operator: 'CONTAINS', value: 'ACT' }, ctx)).toBe(true);
    });

    it('should enforce critical safety rules (Gas / Fire) over energy optimization', async () => {
      const emergencyCtx = {
        roomId: 'room-101',
        roomNumber: '101',
        gasAlert: true,
        gasLevel: 550,
        temperature: 42.0,
        powerW: 80,
      };

      const outcomes = await ruleEngineService.evaluateContext(emergencyCtx);
      const criticalOutcome = outcomes.find(o => o.severity === 'CRITICAL');

      expect(criticalOutcome).toBeDefined();
      expect(criticalOutcome?.reason).toContain('CRITICAL SAFETY');
      expect(criticalOutcome?.actionsToExecute?.map(a => a.type)).toContain('DOOR_UNLOCK');
    });

    it('should simulate rule without physical execution in testRuleSimulation', async () => {
      const simResult = await ruleEngineService.simulateRule({
        conditions: [
          { field: 'temperature', operator: 'GREATER_THAN', value: 30 },
          { field: 'powerW', operator: 'GREATER_THAN', value: 50 },
        ],
        actions: [{ type: 'FAN_ON' }],
        testContext: {
          temperature: 33.0,
          powerW: 75.0,
        },
      });

      expect(simResult.matched).toBe(true);
      expect(simResult.evaluatedConditions.length).toBe(2);
      expect(simResult.simulatedActions.length).toBe(1);
      expect(simResult.safeToExecute).toBe(true);
    });
  });

  describe('4. Recommendation & Automation Lifecycle', () => {
    it('should create AI recommendation and emit WebSocket', async () => {
      const rec = await recommendationService.createRecommendation({
        type: 'ENERGY',
        title: 'Tắt đèn phòng trống 101',
        description: 'Phòng trống 20 phút',
        location: 'room-101',
        reason: 'Không có người',
        recommendation: 'Tắt đèn',
        confidence: 0.95,
        estimatedSavingsKwh: 0.4,
        actions: [{ type: 'LIGHT_OFF', roomId: 'room-101' }],
      });

      expect(rec).toBeDefined();
      expect(mockEventsGateway.broadcastAiRecommendation).toHaveBeenCalled();
    });

    it('should accept recommendation and execute automated actions', async () => {
      const accepted = await recommendationService.acceptRecommendation('rec-1', true, 'admin-user');
      expect(accepted).toBeDefined();
      expect(accepted.status).toBe('EXECUTED');
      expect(accepted.acceptedBy).toBe('admin-user');
      expect(mockDevicesService.sendCommand).toHaveBeenCalled();
    });

    it('should dismiss recommendation properly', async () => {
      const dismissed = await recommendationService.dismissRecommendation('rec-1', 'admin-user', 'Room is reserved');
      expect(dismissed.status).toBe('DISMISSED');
      expect(mockEventsGateway.broadcastAiRecommendation).toHaveBeenCalled();
    });
  });

  describe('5. Controller Endpoints', () => {
    it('GET /api/intelligence/energy/comparison returns benchmark comparison', async () => {
      const comp = await intelligenceController.getForecastComparison({ horizonHours: 24 });
      expect(comp).toBeDefined();
      expect(comp.models.length).toBe(1);
    });

    it('POST /api/intelligence/models/:name/promote promotes active model', async () => {
      const promo = await intelligenceController.promoteModel('energy-gbm-forecaster');
      expect(promo.success).toBe(true);
    });

    it('GET /api/intelligence/models/drift returns drift status', async () => {
      const drift = await intelligenceController.getModelDrift();
      expect(Array.isArray(drift)).toBe(true);
    });

    it('GET /api/intelligence/student/insights returns student personal insights', async () => {
      const studentInsights = await intelligenceController.getStudentInsights({ user: { id: 'student-1' } }, 'room-101');
      expect(studentInsights.room.roomNumber).toBe('101');
      expect(studentInsights.aiInsights).toBeDefined();
    });
  });
});
