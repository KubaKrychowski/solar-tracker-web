export interface AlarmEvent {
  id: string;
  code: string;
  message: string;
  severity: AlarmSeverity;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export type AlarmSeverity = 'info' | 'warning' | 'error' | 'critical';
