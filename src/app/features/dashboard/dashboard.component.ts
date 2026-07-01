import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import * as signalR from '@microsoft/signalr';

import { SignalrService } from '../../core/services/signalr.service';
import { ApiService } from '../../core/services/api.service';
import { TrackerStateService } from '../../core/services/tracker-state.service';
import { TrackerStatus } from '../../shared/models/tracker-status.model';
import { SensorData } from '../../shared/models/sensor-data.model';
import { WindData } from '../../shared/models/wind-data.model';
import { UpsStatus } from '../../shared/models/ups-status.model';
import { AlarmEvent } from '../../shared/models/alarm-event.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
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

  ngOnInit(): void {
    this.api.get<TrackerStatus>('/tracker/status').subscribe({
      next: s => this.state.status.set(s),
      error: () => {},
    });
    this.api.get<AlarmEvent[]>('/alarms/active').subscribe({
      next: a => this.state.alarms.set(a),
    });

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

  ngOnDestroy(): void {}

  goToAlarms(): void {
    this.router.navigate(['/alarms']);
  }

  getStatusIcon(state: string | undefined): string {
    if (state === 'error') return 'error';
    if (state === 'parked') return 'night_shelter';
    return 'check_circle';
  }

  getStatusIconClass(state: string | undefined): string {
    if (state === 'error') return 'icon-error';
    if (state === 'parked') return 'icon-parked';
    return 'icon-ok';
  }

  getModeChipClass(mode: string | undefined): string {
    if (mode === 'auto') return 'chip-auto';
    if (mode === 'manual') return 'chip-manual';
    return 'chip-parking';
  }

  getStateChipClass(state: string | undefined): string {
    if (state === 'error') return 'chip-error';
    if (state === 'moving') return 'chip-moving';
    return 'chip-default';
  }

  getWindClass(speed: number | undefined): string {
    if (!speed) return '';
    if (speed > 15) return 'wind-alarm';
    if (speed > 10) return 'wind-warning';
    return '';
  }

  getBatteryClass(level: number | undefined): string {
    if (level === undefined || level === null) return 'battery-ok';
    if (level < 20) return 'battery-low';
    if (level < 50) return 'battery-mid';
    return 'battery-ok';
  }

  getBatteryBarMode(): 'determinate' {
    return 'determinate';
  }

  getPowerSourceClass(source: string | undefined): string {
    if (source === 'panel') return 'chip-panel';
    if (source === 'ups') return 'chip-ups';
    return 'chip-none';
  }

  getSeverityIcon(severity: string): string {
    return severity === 'critical' ? 'dangerous' : 'warning';
  }

  getSeverityClass(severity: string): string {
    return severity === 'critical' ? 'severity-critical' : 'severity-warning';
  }

  get activeAlarms(): AlarmEvent[] {
    return this.alarms().slice(0, 5);
  }
}
