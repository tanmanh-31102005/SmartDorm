export interface IEmergencyStrategy {
  handle(roomId: string, buildingId: string, sensorData: any): Promise<EmergencyAction[]>;
  getType(): string;
  getLevel(): string;
}

export interface EmergencyAction {
  action: string;
  target: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  result?: string;
}
