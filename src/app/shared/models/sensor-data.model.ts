export interface LdrReadings {
  nw: number;
  ne: number;
  sw: number;
  se: number;
}

export interface SensorData {
  timestamp: string;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  lightIntensity: number;
  ldr: LdrReadings;
}
