export interface AlarmEvent {
  timestamp: string;
  type: AlarmType;
  severity: AlarmSeverity;
  message: string;
  autoAction: string | null;
  resolved: boolean;
}

export type AlarmType = 'highWind' | 'lowUps' | 'overheat' | 'connectionLost';
export type AlarmSeverity = 'warning' | 'critical';
