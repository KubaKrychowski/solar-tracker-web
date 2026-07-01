import { TrackerStatus } from './tracker-status.model';
import { SensorData } from './sensor-data.model';
import { WindData } from './wind-data.model';
import { UpsStatus } from './ups-status.model';

export interface TelemetrySnapshot {
  trackerStatus: TrackerStatus;
  sensorData: SensorData;
  windData: WindData;
  upsStatus: UpsStatus;
  timestamp: string;
}
