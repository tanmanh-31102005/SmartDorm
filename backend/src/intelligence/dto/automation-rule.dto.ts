import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_EQUAL'
  | 'LESS_EQUAL'
  | 'CONTAINS'
  | 'IN';

export class RuleConditionDto {
  @IsString()
  field: string; // e.g. "temperature", "powerW", "occupancyProbability", "motionDetected", "hourOfDay"

  @IsString()
  @IsIn([
    'EQUALS',
    'NOT_EQUALS',
    'GREATER_THAN',
    'LESS_THAN',
    'GREATER_EQUAL',
    'LESS_EQUAL',
    'CONTAINS',
    'IN',
  ])
  operator: ConditionOperator;

  value: any;
}

export type RuleActionType =
  | 'LIGHT_OFF'
  | 'LIGHT_ON'
  | 'FAN_OFF'
  | 'FAN_ON'
  | 'DOOR_LOCK'
  | 'DOOR_UNLOCK'
  | 'NOTIFY_ADMIN'
  | 'EMIT_RECOMMENDATION'
  | 'CUSTOM_MQTT';

export class RuleActionDto {
  @IsString()
  @IsIn([
    'LIGHT_OFF',
    'LIGHT_ON',
    'FAN_OFF',
    'FAN_ON',
    'DOOR_LOCK',
    'DOOR_UNLOCK',
    'NOTIFY_ADMIN',
    'EMIT_RECOMMENDATION',
    'CUSTOM_MQTT',
  ])
  type: RuleActionType;

  @IsOptional()
  @IsString()
  targetRoomId?: string;

  @IsOptional()
  @IsString()
  targetDeviceId?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  payload?: Record<string, any>;
}

export class CreateAutomationRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions: RuleConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  actions: RuleActionDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  priority?: number = 50;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  cooldownMs?: number = 300000;
}

export class UpdateAutomationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions?: RuleConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  actions?: RuleActionDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  cooldownMs?: number;
}

export class TestRuleSimulationDto {
  @IsOptional()
  @IsString()
  ruleId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions?: RuleConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  actions?: RuleActionDto[];

  @IsOptional()
  testContext?: {
    roomId?: string;
    buildingId?: string;
    temperature?: number;
    humidity?: number;
    gasLevel?: number;
    powerW?: number;
    motionDetected?: boolean;
    occupancyProbability?: number;
    predictedState?: 'OCCUPIED' | 'VACANT';
    lightsOn?: boolean;
    fanOn?: boolean;
    hourOfDay?: number;
    dayOfWeek?: number;
    [key: string]: any;
  };
}

export interface AutomationRuleResponseDto {
  id: string;
  name: string;
  description?: string | null;
  conditions: RuleConditionDto[];
  actions: RuleActionDto[];
  priority: number;
  enabled: boolean;
  cooldownMs: number;
  lastTriggeredAt?: Date | string | null;
  createdBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SimulationResultDto {
  matched: boolean;
  ruleName?: string;
  evaluatedConditions: Array<{
    field: string;
    operator: string;
    expectedValue: any;
    actualValue: any;
    passed: boolean;
  }>;
  simulatedActions: RuleActionDto[];
  reasons: string[];
  executionTimeMs: number;
  safeToExecute: boolean;
}
