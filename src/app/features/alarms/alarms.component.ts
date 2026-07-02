import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { toSignal } from '@angular/core/rxjs-interop';

import { ApiService } from '../../core/services/api.service';
import { SignalrService } from '../../core/services/signalr.service';
import { AlarmEvent, AlarmSeverity } from '../../shared/models/alarm-event.model';

@Component({
  selector: 'app-alarms',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule, MatTabsModule],
  templateUrl: './alarms.component.html',
  styleUrl: './alarms.component.scss',
})
export class AlarmsComponent {
  private readonly api = inject(ApiService);
  private readonly signalrSvc = inject(SignalrService);

  readonly activeAlarms = signal<AlarmEvent[]>([]);
  readonly alarmHistory = signal<AlarmEvent[]>([]);
  readonly tabIndex = signal(0);

  private readonly initialActive = toSignal(
    this.api.get<AlarmEvent[]>('/alarms/active'),
    { initialValue: [] }
  );

  private readonly initialHistory = toSignal(
    this.api.get<AlarmEvent[]>('/alarms/history'),
    { initialValue: [] }
  );

  readonly allAlarms = computed(() => [...this.activeAlarms(), ...this.alarmHistory()]);

  readonly filteredAlarms = computed(() => {
    const tab = this.tabIndex();
    if (tab === 1) return this.activeAlarms();
    if (tab === 2) return this.alarmHistory();
    return this.allAlarms();
  });

  readonly activeCount = computed(() => this.activeAlarms().length);
  readonly resolvedCount = computed(() => this.alarmHistory().length);
  readonly criticalCount = computed(() => this.activeAlarms().filter(a => a.severity === 'critical').length);

  constructor() {
    effect(() => {
      const active = this.initialActive();
      if (active.length > 0) this.activeAlarms.set(active);
    });

    effect(() => {
      const history = this.initialHistory();
      if (history.length > 0) this.alarmHistory.set(history);
    });

    const hub = this.signalrSvc.connect('alarms');
    hub.on('OnAlarmEvent', (alarm: AlarmEvent) => {
      if (alarm.resolved) {
        this.activeAlarms.update(list => list.filter(a => a.type !== alarm.type));
        this.alarmHistory.update(list => [alarm, ...list]);
      } else {
        this.activeAlarms.update(list => {
          const filtered = list.filter(a => a.type !== alarm.type);
          return [alarm, ...filtered];
        });
      }
    });
  }

  getSeverityIcon(severity: AlarmSeverity): string {
    return severity === 'critical' ? 'error' : 'warning';
  }

  getSeverityColor(severity: AlarmSeverity): string {
    return severity === 'critical' ? '#F44336' : '#FF9800';
  }

  formatTimestamp(ts: string): string {
    const dt = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }

  getAlarmComponent(type: string): string {
    const components: Record<string, string> = {
      highWind: 'Wind Sensor',
      lowUps: 'UPS',
      overheat: 'Temperature',
      connectionLost: 'Controller',
    };
    return components[type] ?? type;
  }
}
