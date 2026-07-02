import { PowerSource, AtsStatus } from './ups-status.model';

export interface PowerStatus {
  power: number;
  voltage: number;
  current: number;
  batteryLevel: number;
  powerSource: PowerSource;
  atsStatus: AtsStatus;
  inverterOutputW: number;
}

export interface PowerHistoryEntry {
  timestamp: string;
  power: number;
  voltage: number;
  current: number;
  batteryLevel: number;
  powerSource: PowerSource;
  atsStatus: AtsStatus;
  inverterOutputW: number;
}
