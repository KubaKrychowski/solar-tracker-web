import { Injectable, signal } from '@angular/core';
import { TrackerStatus } from '../../shared/models/tracker-status.model';
import { SensorData } from '../../shared/models/sensor-data.model';
import { WindData } from '../../shared/models/wind-data.model';
import { UpsStatus } from '../../shared/models/ups-status.model';
import { AlarmEvent } from '../../shared/models/alarm-event.model';

@Injectable({ providedIn: 'root' })
export class TrackerStateService {
  readonly status = signal<TrackerStatus | null>(null);
  readonly sensors = signal<SensorData | null>(null);
  readonly wind = signal<WindData | null>(null);
  readonly ups = signal<UpsStatus | null>(null);
  readonly alarms = signal<AlarmEvent[]>([]);
}
