import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'control', loadComponent: () => import('./features/control/control.component').then(m => m.ControlComponent) },
  { path: 'charts', loadComponent: () => import('./features/charts/charts.component').then(m => m.ChartsComponent) },
  { path: 'power', loadComponent: () => import('./features/power/power.component').then(m => m.PowerComponent) },
  { path: 'alarms', loadComponent: () => import('./features/alarms/alarms.component').then(m => m.AlarmsComponent) },
];
