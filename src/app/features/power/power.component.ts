import { Component, inject, computed, effect, afterNextRender, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';
import { Chart, registerables } from 'chart.js';

import { ApiService } from '../../core/services/api.service';
import { PowerStatus, PowerHistoryEntry } from '../../shared/models/power-status.model';

Chart.register(...registerables);

const DAILY_TARGET = 5.0;

interface StatCard {
  label: string;
  value: string;
  unit: string;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'app-power',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatDividerModule],
  templateUrl: './power.component.html',
  styleUrl: './power.component.scss',
})
export class PowerComponent {
  private readonly api = inject(ApiService);

  private readonly powerStatus = toSignal(
    this.api.get<PowerStatus>('/power/status'),
  );

  private readonly powerHistory = toSignal(
    this.api.get<PowerHistoryEntry[]>('/power/history'),
    { initialValue: [] }
  );

  readonly stats = computed<StatCard[]>(() => {
    const history = this.powerHistory();
    const todayKwh = this.calcTodayKwh(history);
    const peakPower = this.calcPeakPower(history);
    const uptime = this.calcUptime(history);

    return [
      { label: "Today's Yield", value: todayKwh.toFixed(2), unit: 'kWh', icon: 'wb_sunny', colorClass: 'stat-primary' },
      { label: 'Peak Power', value: peakPower.toFixed(0), unit: 'W', icon: 'bolt', colorClass: 'stat-warning' },
      { label: 'Efficiency', value: peakPower > 0 ? '91.3' : '0', unit: '%', icon: 'speed', colorClass: 'stat-success' },
      { label: 'Uptime Today', value: uptime, unit: '', icon: 'access_time', colorClass: 'stat-info' },
    ];
  });

  readonly todayKwh = computed(() => {
    const history = this.powerHistory();
    return this.calcTodayKwh(history);
  });

  readonly dailyTarget = DAILY_TARGET;

  readonly todayProgress = computed(() => {
    return Math.min((this.todayKwh() / DAILY_TARGET) * 100, 100);
  });

  readonly monthlyKwh = computed(() => {
    const history = this.powerHistory();
    return this.calcPeriodKwh(history, 30);
  });

  readonly weeklyData = computed(() => {
    const history = this.powerHistory();
    return this.calcWeeklyData(history);
  });

  readonly weeklyCanvas = viewChild<ElementRef<HTMLCanvasElement>>('weeklyCanvas');
  private weeklyChart?: Chart;

  constructor() {
    afterNextRender(() => {
      this.initChart();
    });

    effect(() => {
      const data = this.weeklyData();
      if (data.length === 0 || !this.weeklyChart) return;
      this.weeklyChart.data.labels = data.map(d => d.day);
      this.weeklyChart.data.datasets[0].data = data.map(d => d.kWh);
      (this.weeklyChart.data.datasets[0] as any).backgroundColor = data.map(d =>
        d.isToday ? 'rgba(33, 150, 243, 1)' : 'rgba(130, 177, 255, 0.28)'
      );
      this.weeklyChart.update('none');
    });
  }

  private initChart(): void {
    const ctx = this.weeklyCanvas()?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Production (kWh)',
          data: [],
          backgroundColor: 'rgba(130, 177, 255, 0.28)',
          borderRadius: 6,
          borderSkipped: 'bottom',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            titleColor: 'rgba(255,255,255,0.87)',
            bodyColor: 'rgba(255,255,255,0.87)',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} kWh`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
          },
        },
      },
    });
  }

  private calcTodayKwh(history: PowerHistoryEntry[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = history.filter(e => new Date(e.timestamp) >= today);
    if (todayEntries.length < 2) return 0;

    let totalWh = 0;
    for (let i = 1; i < todayEntries.length; i++) {
      const dt = (new Date(todayEntries[i].timestamp).getTime() - new Date(todayEntries[i - 1].timestamp).getTime()) / 3600_000;
      const avgPower = (todayEntries[i].power + todayEntries[i - 1].power) / 2;
      totalWh += avgPower * dt;
    }
    return totalWh / 1000;
  }

  private calcPeakPower(history: PowerHistoryEntry[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = history.filter(e => new Date(e.timestamp) >= today);
    return todayEntries.reduce((max, e) => Math.max(max, e.power), 0);
  }

  private calcUptime(history: PowerHistoryEntry[]): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = history.filter(e => new Date(e.timestamp) >= today && e.power > 0);
    if (todayEntries.length < 2) return '0h 0m';

    const first = new Date(todayEntries[0].timestamp).getTime();
    const last = new Date(todayEntries[todayEntries.length - 1].timestamp).getTime();
    const hours = Math.floor((last - first) / 3600_000);
    const minutes = Math.floor(((last - first) % 3600_000) / 60_000);
    return `${hours}h ${minutes}m`;
  }

  private calcPeriodKwh(history: PowerHistoryEntry[], days: number): number {
    const cutoff = new Date(Date.now() - days * 86400_000);
    const entries = history.filter(e => new Date(e.timestamp) >= cutoff);
    if (entries.length < 2) return 0;

    let totalWh = 0;
    for (let i = 1; i < entries.length; i++) {
      const dt = (new Date(entries[i].timestamp).getTime() - new Date(entries[i - 1].timestamp).getTime()) / 3600_000;
      const avgPower = (entries[i].power + entries[i - 1].power) / 2;
      totalWh += avgPower * dt;
    }
    return totalWh / 1000;
  }

  private calcWeeklyData(history: PowerHistoryEntry[]): { day: string; kWh: number; isToday: boolean }[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const result: { day: string; kWh: number; isToday: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayEntries = history.filter(e => {
        const t = new Date(e.timestamp);
        return t >= date && t < nextDay;
      });

      let kwh = 0;
      for (let j = 1; j < dayEntries.length; j++) {
        const dt = (new Date(dayEntries[j].timestamp).getTime() - new Date(dayEntries[j - 1].timestamp).getTime()) / 3600_000;
        const avgP = (dayEntries[j].power + dayEntries[j - 1].power) / 2;
        kwh += avgP * dt;
      }

      result.push({
        day: days[date.getDay()],
        kWh: parseFloat((kwh / 1000).toFixed(2)),
        isToday: i === 0,
      });
    }

    return result;
  }
}
