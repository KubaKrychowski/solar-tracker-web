# Implementation Report — feat/dashboard

## Status: DONE — ng build SUCCESS (warning only)

## What was done

### DashboardComponent — live dashboard z SignalR

Pliki:
- `src/app/features/dashboard/dashboard.component.ts` — pełna logika, Angular 20 standalone
- `src/app/features/dashboard/dashboard.component.html` — template osobny plik
- `src/app/features/dashboard/dashboard.component.scss` — SCSS osobny plik

### Sekcje UI
- **Górna**: Karta "Tracker Status" — Mode/State chips z kolorami, Azimuth/Elevation (aktualne + docelowe), ikona (zielona/czerwona/szara)
- **Grid 2x2** (responsive, `auto-fit minmax(300px, 1fr)`):
  - Sensors Card — Voltage, Current, Power, Temperature, Light Intensity z ikonami
  - Wind Card — Speed (ostrzeżenie >10 m/s, alarm >15 m/s), Direction z kompasem
  - UPS Card — Battery z `mat-progress-bar` (zielony/żółty/czerwony), PowerSource chip, ATS Status, Inverter Output
  - Alarms Card — lista max 5 alarmów z severity icons, klik → `/alarms`
- **Dolna**: connection status indicator (zielona/czerwona kropka)

### Logika
- `ngOnInit`: initial REST load (GET /tracker/status, GET /alarms/active), SignalR connect('tracker') + connect('alarms'), nasłuch na 5 zdarzeń
- `ngOnDestroy`: pusta (state persists across routes)
- Sygnały Angular 20: `connected = signal(false)`, exposuje `this.state.*` do template
- Import `* as signalR` do sprawdzenia `HubConnectionState.Connected`

### Build
```
dashboard-component chunk: 122.86 kB (lazy loaded)
Warning: SCSS budget 4.40 kB / limit 4.00 kB (tylko ostrzeżenie, build SUCCESS)
```

### Uwagi
- Brak komentarzy w kodzie (zgodnie z zasadami)
- Standalone component z pełną listą Material imports
- SCSS używa CSS variables Angular Material (`--mat-sys-*`)

---

# Implementation Report — chore/web-scaffolding

## Status: DONE — ng build SUCCESS

## What was done

### Angular project
- Angular 20.1.0, SCSS, no SSR, skip-git
- Angular Material 20.2.14 added via `ng add`
- `@microsoft/signalr` installed
- `@angular/animations@^20.1.0` installed manually (missing transitive dep from Material)

### Structure
```
src/
├── environments/
│   ├── environment.ts          (dev — localhost:5000)
│   └── environment.prod.ts     (prod — /api, /hubs)
└── app/
    ├── app.ts                  (AppComponent z Material sidenav + toolbar)
    ├── app.html                (sidenav template)
    ├── app.scss                (layout styles)
    ├── app.config.ts           (provideRouter, provideHttpClient, provideAnimationsAsync)
    ├── app.routes.ts           (lazy routes: dashboard/control/charts/power/alarms)
    ├── core/services/
    │   ├── api.service.ts
    │   ├── signalr.service.ts
    │   └── tracker-state.service.ts
    ├── features/
    │   ├── dashboard/dashboard.component.ts
    │   ├── control/control.component.ts
    │   ├── charts/charts.component.ts
    │   ├── power/power.component.ts
    │   └── alarms/alarms.component.ts
    └── shared/models/
        ├── tracker-status.model.ts
        ├── sensor-data.model.ts
        ├── wind-data.model.ts
        ├── ups-status.model.ts
        ├── alarm-event.model.ts
        └── telemetry-snapshot.model.ts
```

### angular.json
- fileReplacements dla production (environment.prod.ts)

### Build output
```
Initial chunk files  | Names         | Raw size | Transfer size
main-G5MWIQDW.js     | main          | 228.56 kB|  50.32 kB
polyfills-5CFQRCPP.js| polyfills     |  34.59 kB|  11.33 kB
styles-DTTV3AOM.css  | styles        |   8.10 kB|   1.32 kB

Lazy chunk files (per feature):
dashboard-component  | 312 bytes
control-component    | 306 bytes
charts-component     | 303 bytes
alarms-component     | 303 bytes
power-component      | 300 bytes
```

## Uwagi
- Angular 20 używa `app.ts` (nie `app.component.ts`) i separuje template do `app.html`
- Lazy loading działa poprawnie — każdy feature to osobny chunk
- Enumy jako string union types (camelCase), zgodnie z `JsonStringEnumConverter` na backendzie
