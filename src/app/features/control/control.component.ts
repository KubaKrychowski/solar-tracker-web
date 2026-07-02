import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { TrackerStateService } from '../../core/services/tracker-state.service';
import { SignalrService } from '../../core/services/signalr.service';
import { TrackerStatus, TrackerMode } from '../../shared/models/tracker-status.model';

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatButtonToggleModule,
    MatIconModule, MatSliderModule, MatChipsModule, MatDividerModule,
  ],
  templateUrl: './control.component.html',
  styleUrl: './control.component.scss',
})
export class ControlComponent {
  private readonly api = inject(ApiService);
  private readonly state = inject(TrackerStateService);
  private readonly signalrSvc = inject(SignalrService);
  private readonly snackBar = inject(MatSnackBar);

  readonly status = this.state.status;
  readonly isMoving = signal(false);

  targetAz = signal(0);
  targetEl = signal(0);

  private readonly initialStatus = toSignal(
    this.api.get<TrackerStatus>('/tracker/status')
  );

  constructor() {
    effect(() => {
      const s = this.initialStatus();
      if (s) {
        this.state.status.set(s);
        this.targetAz.set(s.azimuth);
        this.targetEl.set(s.elevation);
      }
    });

    const tracker = this.signalrSvc.connect('tracker');
    tracker.on('OnStatusUpdate', (s: TrackerStatus) => {
      this.state.status.set(s);
      if (s.state !== 'moving') {
        this.isMoving.set(false);
      }
    });
  }

  onModeChange(mode: TrackerMode): void {
    this.api.post('/command/mode', { mode }).subscribe({
      next: () => this.snackBar.open(`Mode changed to ${mode}`, 'OK', { duration: 3000 }),
    });
  }

  sendToTarget(): void {
    this.isMoving.set(true);
    this.api.post('/command/move', {
      azimuth: this.targetAz(),
      elevation: this.targetEl(),
    }).subscribe({
      next: () => this.snackBar.open(
        `Moving to Az: ${this.targetAz().toFixed(1)}° / El: ${this.targetEl().toFixed(1)}°`,
        'OK', { duration: 3000 }
      ),
    });
  }

  parkTracker(): void {
    this.onModeChange('parking');
  }

  formatAzLabel(value: number): string {
    if (value === 0 || value === 360) return 'N';
    if (value === 90) return 'E';
    if (value === 180) return 'S';
    if (value === 270) return 'W';
    return `${value}°`;
  }

  formatElLabel(value: number): string {
    return `${value}°`;
  }

  getStateChipClass(): string {
    switch (this.status()?.state) {
      case 'moving': return 'chip chip-moving';
      case 'error': return 'chip chip-error';
      case 'parked': return 'chip chip-parked';
      default: return 'chip chip-idle';
    }
  }
}
