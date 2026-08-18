export type CopilotIntent =
  | 'ENERGY_ANALYSIS'
  | 'ENERGY_FORECAST'
  | 'DEVICE_ANOMALY'
  | 'ROOM_ENVIRONMENT'
  | 'SECURITY_ACCESS'
  | 'OCCUPANCY_PREDICTION'
  | 'MODEL_HEALTH'
  | 'RECOMMENDATIONS'
  | 'SYSTEM_STATUS'
  | 'SAFETY_OVERRIDE_ATTEMPT'
  | 'GENERAL_INQUIRY';

export type DataSourceType =
  | 'WOKWI_SIMULATION'
  | 'REAL_HARDWARE'
  | 'ML_INFERENCE'
  | 'DATABASE'
  | 'SYSTEM_RULE_ENGINE';

export class CopilotQueryContextDto {
  roomId?: string;
  roomNumber?: string;
  buildingId?: string;
  role?: 'ADMIN' | 'STUDENT' | 'MANAGER';
  userId?: string;
  clientOrigin?: string;
}

export class CopilotChatMessageDto {
  role!: 'user' | 'model';
  text!: string;
}

export class CopilotQueryDto {
  message!: string;
  context?: CopilotQueryContextDto;
  history?: CopilotChatMessageDto[];
}

export class CopilotStructuredResponseDto {
  intent!: CopilotIntent;
  answer!: string;
  confidence!: number; // 0.0 to 1.0
  dataSources!: string[];
  insights!: string[];
  recommendations!: string[];
  severity!: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL';
  dataSourceType!: DataSourceType;
  timestamp!: string;
  groundedContext?: Record<string, any>;
  privacyNotice?: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  prompt: string;
  category: string;
  icon: string;
}
