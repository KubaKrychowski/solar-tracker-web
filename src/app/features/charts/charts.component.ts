import { Component, inject, signal, computed, effect, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { toSignal } from '@angular/core/rxjs-interop';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { ApiService } from '../../core/services/api.service';
import { TelemetrySnapshot } from '../../shared/models/telemetry-snapshot.model';

Chart.register(...registerables);

type TimeRange = '6H' | '12H' | '24H';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonToggleModule],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.scss',
})
export class ChartsComponent {
  private readonly api = inject(ApiService);

  readonly range = signal<TimeRange>('24H');

  private readonly rangeHours: Record<TimeRange, number> = { '6H': 6, '12H': 12, '24H': 24 };

  private readonly history = toSignal(
    this.api.get<TelemetrySnapshot[]>('/telemetry/history'),
    { initialValue: [] }
  );

  readonly chartData = computed(() => {
    const data = this.history();
    const hours = this.rangeHours[this.range()];
    const cutoff = new Date(Date.now() - hours * 3600_000);
    return data.filter(d => new Date(d.timestamp) >= cutoff);
  });

  readonly powerCanvas = viewChild<ElementRef<HTMLCanvasElement>>('powerCanvas');
  readonly voltageCanvas = viewChild<ElementRef<HTMLCanvasElement>>('voltageCanvas');
  readonly temperatureCanvas = viewChild<ElementRef<HTMLCanvasElement>>('temperatureCanvas');

  private powerChart?: Chart;
  private voltageChart?: Chart;
  private temperatureChart?: Chart;

  constructor() {
    afterNextRender(() => {
      this.initCharts();
    });

    effect(() => {
      const data = this.chartData();
      if (data.length === 0) return;

      const labels = data.map(d => {
        const dt = new Date(d.timestamp);
        return `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
      });

      this.updatePowerChart(labels, data);
      this.updateVoltageChart(labels, data);
      this.updateTemperatureChart(labels, data);
    });
  }

  private initCharts(): void {
    const powerCtx = this.powerCanvas()?.nativeElement.getContext('2d');
    if (powerCtx) {
      this.powerChart = this.createAreaChart(powerCtx, 'Power (W)', 'rgba(33, 150, 243, 1)', 'rgba(33, 150, 243, 0.15)');
    }

    const voltageCtx = this.voltageCanvas()?.nativeElement.getContext('2d');
    if (voltageCtx) {
      this.voltageChart = this.createDualLineChart(voltageCtx);
    }

    const tempCtx = this.temperatureCanvas()?.nativeElement.getContext('2d');
    if (tempCtx) {
      this.temperatureChart = this.createAreaChart(tempCtx, 'Temperature (°C)', 'rgba(244, 67, 54, 1)', 'rgba(244, 67, 54, 0.15)');
    }
  }

  private createAreaChart(ctx: CanvasRenderingContext2D, label: string, stroke: string, fill: string): Chart {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label,
          data: [],
          borderColor: stroke,
          backgroundColor: fill,
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
        }],
      },
      options: this.getBaseOptions(),
    });
  }

  private createDualLineChart(ctx: CanvasRenderingContext2D): Chart {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Voltage (V)',
            data: [],
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            yAxisID: 'yVoltage',
          },
          {
            label: 'Current (A)',
            data: [],
            borderColor: 'rgba(255, 152, 0, 1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            yAxisID: 'yCurrent',
          },
        ],
      },
      options: {
        ...this.getBaseOptions(),
        plugins: {
          ...this.getBaseOptions()!.plugins,
          legend: { display: true, labels: { color: 'rgba(255,255,255,0.7)', font: { size: 12 } } },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
          },
          yVoltage: {
            position: 'left',
            title: { display: true, text: 'V', color: 'rgba(255,255,255,0.5)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
          },
          yCurrent: {
            position: 'right',
            title: { display: true, text: 'A', color: 'rgba(255,255,255,0.5)' },
            grid: { drawOnChartArea: false },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
          },
        },
      },
    });
  }

  private getBaseOptions(): ChartConfiguration<'line'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          titleColor: 'rgba(255,255,255,0.87)',
          bodyColor: 'rgba(255,255,255,0.87)',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.08)' },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.08)' },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
        },
      },
    };
  }

  private updatePowerChart(labels: string[], data: TelemetrySnapshot[]): void {
    if (!this.powerChart) return;
    this.powerChart.data.labels = labels;
    this.powerChart.data.datasets[0].data = data.map(d => d.power);
    this.powerChart.update('none');
  }

  private updateVoltageChart(labels: string[], data: TelemetrySnapshot[]): void {
    if (!this.voltageChart) return;
    this.voltageChart.data.labels = labels;
    this.voltageChart.data.datasets[0].data = data.map(d => d.voltage);
    this.voltageChart.data.datasets[1].data = data.map(d => d.current);
    this.voltageChart.update('none');
  }

  private updateTemperatureChart(labels: string[], data: TelemetrySnapshot[]): void {
    if (!this.temperatureChart) return;
    this.temperatureChart.data.labels = labels;
    this.temperatureChart.data.datasets[0].data = data.map(d => d.temperature);
    this.temperatureChart.update('none');
  }
}
