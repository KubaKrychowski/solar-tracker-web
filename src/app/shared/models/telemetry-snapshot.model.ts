import { TrackerMode, TrackerState } from './tracker-status.model';
import { PowerSource, AtsStatus } from './ups-status.model';

export interface TelemetrySnapshot {
  id: number;
  timestamp: string;

  azimuth: number;
  elevation: number;
  targetAzimuth: number;
  targetElevation: number;
  mode: TrackerMode;
  state: TrackerState;

  voltage: number;
  current: number;
  power: number;
  temperature: number;
  lightIntensity: number;

  windSpeed: number;
  windDirection: number;

  batteryLevel: number;
  powerSource: PowerSource;
  inverterOutputW: number;
  atsStatus: AtsStatus;
}
