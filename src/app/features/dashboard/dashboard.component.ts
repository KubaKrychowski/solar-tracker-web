import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { of } from 'rxjs';
import * as signalR from '@microsoft/signalr';

import { SignalrService } from '../../core/services/signalr.service';
import { ApiService } from '../../core/services/api.service';
import { TrackerStateService } from '../../core/services/tracker-state.service';
import { TrackerStatus } from '../../shared/models/tracker-status.model';
import { SensorData } from '../../shared/models/sensor-data.model';
import { WindData } from '../../shared/models/wind-data.model';
import { UpsStatus } from '../../shared/models/ups-status.model';
import { AlarmEvent } from '../../shared/models/alarm-event.model';
import { SensorRow } from '../../shared/models/sensor-row.model';

const MAX_VISIBLE_ALARMS = 5;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly signalrSvc = inject(SignalrService);
  private readonly api = inject(ApiService);
  private readonly state = inject(TrackerStateService);
  private readonly router = inject(Router);

  readonly status = this.state.status;
  readonly sensors = this.state.sensors;
  readonly wind = this.state.wind;
  readonly ups = this.state.ups;
  readonly alarms = this.state.alarms;

  readonly connected = signal(false);

  private readonly initialStatus = toSignal(
    this.api.get<TrackerStatus>('/tracker/status')
  );
  private readonly initialAlarms = toSignal(
    this.api.get<AlarmEvent[]>('/alarms/active')
  );

  constructor() {
    effect(() => {
      const s = this.initialStatus();
      if (s) this.state.status.set(s);
    });
    effect(() => {
      const a = this.initialAlarms();
      if (a?.length) this.state.alarms.set(a);
    });
  }

  ngOnInit(): void {
    const tracker = this.signalrSvc.connect('tracker');
    tracker.on('OnStatusUpdate', (s: TrackerStatus) => this.state.status.set(s));
    tracker.on('OnSensorsUpdate', (s: SensorData) => this.state.sensors.set(s));
    tracker.on('OnWindUpdate', (w: WindData) => this.state.wind.set(w));
    tracker.on('OnUpsUpdate', (u: UpsStatus) => this.state.ups.set(u));

    const alarmHub = this.signalrSvc.connect('alarms');
    alarmHub.on('OnAlarmRaised', (a: AlarmEvent) => {
      this.state.alarms.update(list => [...list.filter(x => x.type !== a.type), a]);
    });
    alarmHub.on('OnAlarmResolved', (a: AlarmEvent) => {
      this.state.alarms.update(list => list.filter(x => x.type !== a.type));
    });

    tracker.onreconnected(() => this.connected.set(true));
    tracker.onclose(() => this.connected.set(false));
    if (tracker.state === signalR.HubConnectionState.Connected) {
      this.connected.set(true);
    }
  }

  goToAlarms(): void {
    this.router.navigate(['/alarms']);
  }

  getSensorRows(s: SensorData): SensorRow[] {
    return [
      { icon: 'bolt', color: '#FFA726', label: 'Voltage', value: s.voltage.toFixed(1), unit: 'V' },
      { icon: 'cable', color: '#42A5F5', label: 'Current', value: s.current.toFixed(1), unit: 'A' },
      { icon: 'local_fire_department', color: '#EF5350', label: 'Power', value: s.power.toFixed(0), unit: 'W' },
      { icon: 'thermostat', color: '#FF7043', label: 'Temperature', value: s.temperature.toFixed(1), unit: '°C' },
      { icon: 'light_mode', color: '#FFD54F', label: 'Light', value: s.lightIntensity.toLocaleString(), unit: 'lux' },
    ];
  }

  getModeChipClass(mode: string): string {
    switch (mode.toLowerCase()) {
      case 'auto': return 'chip chip-auto';
      case 'manual': return 'chip chip-manual';
      default: return 'chip chip-parking';
    }
  }

  getStateChipClass(state: string): string {
    switch (state.toLowerCase()) {
      case 'moving': return 'chip chip-moving';
      case 'error': return 'chip chip-error';
      default: return 'chip chip-idle';
    }
  }

  getWindValueClass(speed: number): string {
    if (speed > 15) return 'wind-danger';
    if (speed > 10) return 'wind-warning';
    return '';
  }

  getWindCompass(deg: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  getBatteryColor(level: number): string {
    if (level > 50) return 'primary';
    if (level > 20) return 'accent';
    return 'warn';
  }

  getPowerSourceChipClass(source: string): string {
    switch (source.toLowerCase()) {
      case 'grid': return 'chip chip-success';
      case 'battery': return 'chip chip-warning';
      default: return 'chip chip-info';
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return 'severity-critical';
      case 'warning': return 'severity-warning';
      default: return 'severity-info';
    }
  }

  get activeAlarms(): AlarmEvent[] {
    return this.alarms().filter(a => !a.resolved).slice(0, MAX_VISIBLE_ALARMS);
  }
}
