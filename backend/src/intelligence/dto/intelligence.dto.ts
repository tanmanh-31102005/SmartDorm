export interface IntelligenceStatsDto {
  totalRooms: number;
  totalActiveDevices: number;
  todayEnergyKwh: number;
  predictedEnergyKwh: number;
  energySavedKwh: number;
  openAnomaliesCount: number;
  pendingRecommendationsCount: number;
  activeAutomationRulesCount: number;
}

export interface ForecastSummaryDto {
  currentActualPowerW: number;
  predictedNextHourPowerW: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  peakHour: string;
  peakPredictedPowerW: number;
}

export interface OccupancyOverviewDto {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number; // 0.0 - 100.0%
}

export interface ModelHealthDto {
  name: string;
  version: string;
  type: string; // "FORECAST" | "ANOMALY" | "OCCUPANCY"
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'EXPERIMENTAL' | 'ACTIVE';
  inferenceLatencyMs: number;
  metrics: {
    mae?: number;
    rmse?: number;
    mape?: number;
    f1Score?: number;
    accuracy?: number;
    samplesEvaluated?: number;
    [key: string]: any;
  };
  lastTrainedAt?: Date | string;
  endpoint?: string;
  isFallback: boolean;
}

export interface IntelligenceOverviewDto {
  stats: IntelligenceStatsDto;
  forecastSummary: ForecastSummaryDto;
  occupancyOverview: OccupancyOverviewDto;
  topRecommendations: RecommendationResponseDto[];
  modelHealth: ModelHealthDto[];
  lastUpdated: string;
}

export interface ForecastPointDto {
  timestamp: string; // ISO string
  actualPowerW?: number | null;
  forecastPowerW: number;
  lowerBoundW: number;
  upperBoundW: number;
  confidence: number; // 0.0 - 1.0
}

export interface EnergyForecastResponseDto {
  buildingId?: string;
  roomId?: string;
  horizonHours: number;
  interval: string;
  source: 'GBM_MULTIVARIATE_CHAMPION' | 'FASTAPI_PROPHET' | 'BASELINE_PROXY' | 'LSTM_NEURAL_NETWORK' | 'BASELINE_DIURNAL' | string;
  generatedAt: string;
  summary: {
    totalForecastKwh: number;
    peakPowerW: number;
    peakTimestamp: string;
    averagePowerW: number;
    baselineComparisonPercent?: number;
  };
  points: ForecastPointDto[];
}

export interface DeviceAnomalyDto {
  id: string;
  deviceId?: string | null;
  deviceName: string;
  roomId: string;
  roomNumber?: string;
  buildingName?: string;
  anomalyScore: number; // 0.0 - 1.0
  severity: 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL';
  features: {
    powerW?: number;
    responseMs?: number;
    failureRate?: number;
    uptimeHours?: number;
    temperature?: number;
    [key: string]: any;
  };
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  recommendation?: string | null;
  detectedAt: Date | string;
  resolvedAt?: Date | string | null;
  evidence?: any;
}

export interface OccupancyRoomDto {
  roomId: string;
  roomNumber: string;
  buildingName: string;
  floor: number;
  occupiedProbability: number; // 0.0 - 1.0
  predictedState: 'OCCUPIED' | 'VACANT';
  confidence: number;
  source: 'ML_MODEL' | 'RULE_PROXY';
  lastMovementAt?: Date | string | null;
  activeDevicesCount: number;
  currentPowerW: number;
  updatedAt: Date | string;
}

export interface OccupancyResponseDto {
  buildingId?: string;
  totalRooms: number;
  occupiedCount: number;
  vacantCount: number;
  averageOccupancyRate: number;
  rooms: OccupancyRoomDto[];
  timestamp: string;
}

export interface RecommendationActionPayload {
  type: 'LIGHT_OFF' | 'LIGHT_ON' | 'FAN_OFF' | 'FAN_ON' | 'DOOR_LOCK' | 'DOOR_UNLOCK' | 'NOTIFY_ADMIN' | 'CUSTOM';
  roomId?: string;
  targetRoomId?: string;
  deviceId?: string;
  deviceType?: string;
  action?: string;
  description?: string;
  parameters?: Record<string, any>;
}


export interface RecommendationResponseDto {
  id: string;
  type: 'ENERGY' | 'DEVICE' | 'SECURITY' | 'OCCUPANCY' | 'MAINTENANCE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  location?: string | null;
  roomNumber?: string;
  buildingName?: string;
  reason: string;
  recommendation: string;
  confidence?: number | null;
  evidence?: Record<string, any> | null;
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED' | 'EXECUTED';
  estimatedSavingsKwh?: number;
  actions?: RecommendationActionPayload[];
  acceptedBy?: string | null;
  acceptedAt?: Date | string | null;
  dismissedAt?: Date | string | null;
  executedAt?: Date | string | null;
  executionResult?: string | null;
  expiresAt?: Date | string | null;
  createdAt: Date | string;
}
