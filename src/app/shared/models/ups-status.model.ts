export interface UpsStatus {
  batteryLevel: number;
  inputVoltage: number;
  outputVoltage: number;
  loadPercent: number;
  status: UpsState;
  estimatedRuntime: number;
  timestamp: string;
}

export type UpsState = 'online' | 'onBattery' | 'charging' | 'fault' | 'unknown';
