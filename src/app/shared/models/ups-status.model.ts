export interface UpsStatus {
  timestamp: string;
  batteryLevel: number;
  powerSource: PowerSource;
  inverterOutputW: number;
  atsStatus: AtsStatus;
}

export type PowerSource = 'panel' | 'ups' | 'none';
export type AtsStatus = 'normal' | 'switchedToUps' | 'fault';
