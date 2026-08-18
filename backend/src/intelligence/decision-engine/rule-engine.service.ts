import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RuleConditionDto,
  RuleActionDto,
  TestRuleSimulationDto,
  SimulationResultDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  AutomationRuleResponseDto,
} from '../dto/automation-rule.dto';
import { ENERGY_RULES, RuleEvaluationContext, EvaluationOutcome, DecisionEngineBuiltinRule } from './rules/energy-rules';
import { OCCUPANCY_RULES } from './rules/occupancy-rules';
import { DEVICE_RULES } from './rules/device-rules';

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger('RuleEngineService');
  private readonly cooldownMap: Map<string, number> = new Map(); // key: `ruleId:roomId` -> timestamp

  private readonly builtinRules: DecisionEngineBuiltinRule[] = [
    ...DEVICE_RULES,    // Safety first (Priority 1)
    ...OCCUPANCY_RULES, // Priority 50
    ...ENERGY_RULES,    // Priority 65-80
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates all built-in and active database rules against the given context
   */
  async evaluateContext(context: RuleEvaluationContext): Promise<EvaluationOutcome[]> {
    const outcomes: EvaluationOutcome[] = [];

    // 1. Fetch active database rules
    const dbRules = await this.prisma.automationRule.findMany({
      where: { enabled: true },
      orderBy: { priority: 'asc' },
    });

    // 2. Combine and sort all rules by priority (1 = highest safety)
    const combinedRules = [
      ...this.builtinRules.map(r => ({
        id: r.id,
        name: r.name,
        priority: r.priority,
        cooldownMs: r.cooldownMs,
        evaluate: () => r.evaluate(context),
      })),
      ...dbRules.map(dbRule => ({
        id: dbRule.id,
        name: dbRule.name,
        priority: dbRule.priority,
        cooldownMs: dbRule.cooldownMs,
        evaluate: () => this.evaluateDbRule(dbRule, context),
      })),
    ].sort((a, b) => a.priority - b.priority);

    // 3. Evaluate each rule in order of priority
    for (const rule of combinedRules) {
      const cooldownKey = `${rule.id}:${context.roomId}`;
      const lastTriggered = this.cooldownMap.get(cooldownKey) || 0;
      const now = Date.now();

      if (now - lastTriggered < rule.cooldownMs) {
        // Still in cooldown period
        continue;
      }

      try {
        const outcome = rule.evaluate();
        if (outcome.matched) {
          this.cooldownMap.set(cooldownKey, now);
          outcomes.push(outcome);

          // Update lastTriggeredAt for DB rules
          if (!rule.id.startsWith('builtin-')) {
            this.prisma.automationRule.update({
              where: { id: rule.id },
              data: { lastTriggeredAt: new Date() },
            }).catch(() => {});
          }

          // If this is a CRITICAL SAFETY rule, it takes absolute precedence
          if (outcome.severity === 'CRITICAL' && rule.priority <= 10) {
            this.logger.warn(`CRITICAL SAFETY RULE TRIGGERED: ${rule.name} for Room ${context.roomId}`);
          }
        }
      } catch (err: any) {
        this.logger.error(`Error evaluating rule ${rule.name}: ${err.message}`);
      }
    }

    return outcomes;
  }

  /**
   * Evaluates a custom database rule against a given context
   */
  private evaluateDbRule(dbRule: any, context: RuleEvaluationContext): EvaluationOutcome {
    let conditions: RuleConditionDto[] = [];
    let actions: RuleActionDto[] = [];

    try {
      conditions = typeof dbRule.conditions === 'string' ? JSON.parse(dbRule.conditions) : dbRule.conditions;
      actions = typeof dbRule.actions === 'string' ? JSON.parse(dbRule.actions) : dbRule.actions;
    } catch {
      return { matched: false };
    }

    const allConditionsPassed = conditions.every(c => this.evaluateSingleCondition(c, context));

    if (allConditionsPassed && conditions.length > 0) {
      const actionsToExecute: RuleActionDto[] = actions.map(a => ({
        ...a,
        targetRoomId: a.targetRoomId || context.roomId,
      }));

      return {
        matched: true,
        reason: `Quy tắc tự động hóa tùy chỉnh '${dbRule.name}' được kích hoạt.`,
        severity: dbRule.priority <= 20 ? 'CRITICAL' : dbRule.priority <= 50 ? 'WARNING' : 'INFO',
        actionsToExecute,
        recommendation: actions.some(a => a.type === 'EMIT_RECOMMENDATION') ? {
          type: 'ENERGY',
          title: `Tự động hóa: ${dbRule.name}`,
          description: dbRule.description || `Quy tắc tự động '${dbRule.name}' phát hiện điều kiện thỏa mãn.`,
          reason: `Các điều kiện cấu hình đã thỏa mãn tại phòng ${context.roomNumber || context.roomId}`,
          recommendation: `Thực thi các hành động đã cấu hình trong quy tắc.`,
          confidence: 1.0,
          actions: actionsToExecute,
          evidence: {
            ruleId: dbRule.id,
            conditions,
            contextValues: conditions.map(c => ({ field: c.field, value: context[c.field] })),
          },
        } : undefined,
      };
    }

    return { matched: false };
  }

  /**
   * Helper to evaluate a single condition operator
   */
  public evaluateSingleCondition(condition: RuleConditionDto, context: RuleEvaluationContext): boolean {
    const actualValue = context[condition.field];
    const expectedValue = condition.value;

    if (actualValue === undefined || actualValue === null) {
      return false;
    }

    switch (condition.operator) {
      case 'EQUALS':
        return actualValue === expectedValue;
      case 'NOT_EQUALS':
        return actualValue !== expectedValue;
      case 'GREATER_THAN':
        return Number(actualValue) > Number(expectedValue);
      case 'LESS_THAN':
        return Number(actualValue) < Number(expectedValue);
      case 'GREATER_EQUAL':
        return Number(actualValue) >= Number(expectedValue);
      case 'LESS_EQUAL':
        return Number(actualValue) <= Number(expectedValue);
      case 'CONTAINS':
        return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'IN':
        return Array.isArray(expectedValue) ? expectedValue.includes(actualValue) : false;
      default:
        return false;
    }
  }

  /**
   * Test / Simulate a rule without executing physical actions
   */
  async simulateRule(dto: TestRuleSimulationDto): Promise<SimulationResultDto> {
    const start = Date.now();
    let conditions: RuleConditionDto[] = dto.conditions || [];
    let actions: RuleActionDto[] = dto.actions || [];
    let ruleName = 'Simulation Test Rule';

    if (dto.ruleId) {
      const found = await this.prisma.automationRule.findUnique({ where: { id: dto.ruleId } });
      if (found) {
        ruleName = found.name;
        if (!dto.conditions) {
          conditions = typeof found.conditions === 'string' ? JSON.parse(found.conditions) : found.conditions;
        }
        if (!dto.actions) {
          actions = typeof found.actions === 'string' ? JSON.parse(found.actions) : found.actions;
        }
      }
    }

    const testContext: RuleEvaluationContext = {
      roomId: dto.testContext?.roomId || 'sim-room-01',
      roomNumber: '101',
      buildingName: 'Tòa A',
      temperature: 28.5,
      humidity: 65,
      gasLevel: 45,
      powerW: 75,
      motionDetected: false,
      occupancyProbability: 0.1,
      predictedState: 'VACANT',
      lightsOn: true,
      fanOn: true,
      hourOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      ...(dto.testContext || {}),
    };

    const conditionEvaluations = conditions.map(cond => {
      const actualValue = testContext[cond.field];
      const passed = this.evaluateSingleCondition(cond, testContext);
      return {
        field: cond.field,
        operator: cond.operator,
        expectedValue: cond.value,
        actualValue: actualValue !== undefined ? actualValue : null,
        passed,
      };
    });

    const matched = conditionEvaluations.length > 0 && conditionEvaluations.every(c => c.passed);
    const reasons: string[] = [];

    if (matched) {
      reasons.push(`Tất cả ${conditionEvaluations.length} điều kiện đều thỏa mãn với ngữ cảnh thử nghiệm.`);
    } else {
      const failed = conditionEvaluations.filter(c => !c.passed);
      reasons.push(`Có ${failed.length}/${conditionEvaluations.length} điều kiện không thỏa mãn: ${failed.map(f => `${f.field} (${f.actualValue}) ${f.operator} ${f.expectedValue}`).join(', ')}`);
    }

    return {
      matched,
      ruleName,
      evaluatedConditions: conditionEvaluations,
      simulatedActions: matched ? actions : [],
      reasons,
      executionTimeMs: Date.now() - start,
      safeToExecute: true,
    };
  }

  // ==================== CRUD RULES ====================

  async getAllRules(): Promise<AutomationRuleResponseDto[]> {
    const rules = await this.prisma.automationRule.findMany({
      orderBy: [{ enabled: 'desc' }, { priority: 'asc' }, { createdAt: 'desc' }],
    });

    return rules.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      conditions: typeof r.conditions === 'string' ? JSON.parse(r.conditions) : r.conditions,
      actions: typeof r.actions === 'string' ? JSON.parse(r.actions) : r.actions,
      priority: r.priority,
      enabled: r.enabled,
      cooldownMs: r.cooldownMs,
      lastTriggeredAt: r.lastTriggeredAt,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async createRule(dto: CreateAutomationRuleDto, userId?: string): Promise<AutomationRuleResponseDto> {
    const rule = await this.prisma.automationRule.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        conditions: JSON.stringify(dto.conditions),
        actions: JSON.stringify(dto.actions),
        priority: dto.priority || 50,
        enabled: dto.enabled !== undefined ? dto.enabled : false,
        cooldownMs: dto.cooldownMs || 300000,
        createdBy: userId || null,
      },
    });

    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      conditions: dto.conditions,
      actions: dto.actions,
      priority: rule.priority,
      enabled: rule.enabled,
      cooldownMs: rule.cooldownMs,
      lastTriggeredAt: rule.lastTriggeredAt,
      createdBy: rule.createdBy,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }

  async updateRule(id: string, dto: UpdateAutomationRuleDto): Promise<AutomationRuleResponseDto> {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.conditions !== undefined) data.conditions = JSON.stringify(dto.conditions);
    if (dto.actions !== undefined) data.actions = JSON.stringify(dto.actions);
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.enabled !== undefined) data.enabled = dto.enabled;
    if (dto.cooldownMs !== undefined) data.cooldownMs = dto.cooldownMs;

    const rule = await this.prisma.automationRule.update({
      where: { id },
      data,
    });

    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      conditions: typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions,
      actions: typeof rule.actions === 'string' ? JSON.parse(rule.actions) : rule.actions,
      priority: rule.priority,
      enabled: rule.enabled,
      cooldownMs: rule.cooldownMs,
      lastTriggeredAt: rule.lastTriggeredAt,
      createdBy: rule.createdBy,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}
