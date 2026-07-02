# Solar Tracker Web

Angular dashboard for a 2-axis IoT solar tracker. Real-time monitoring of tracker position, telemetry, power production, and alarms via SignalR.

## Stack

- Angular 20, standalone components, signals
- Angular Material 20 (dark mode default)
- Chart.js (telemetry & power charts)
- SignalR (real-time push from backend)

## Features

| Page | Description |
|------|-------------|
| **Dashboard** | Live tracker status (mode, state, azimuth, elevation), sensor readings, wind speed with compass, UPS battery level, active alarms |
| **Control** | Operating mode toggle (Auto/Manual/Parking), manual azimuth/elevation sliders, quick commands |
| **Charts** | Telemetry history — Power Output (area), Voltage & Current (dual Y-axis), Temperature (area). Range: 6H / 12H / 24H / 7D / 30D |
| **Power** | Energy stats (yield, peak, efficiency, uptime), daily target progress bar, weekly production bar chart |
| **Alarms** | Alarm list with severity colors, summary chips, tab filtering (All/Active/Resolved), real-time SignalR updates |

## Architecture

```
src/
├── app/
│   ├── core/
│   │   ├── interceptors/
│   │   │   └── http-error.interceptor.ts    # Global HTTP error → MatSnackBar
│   │   └── services/
│   │       ├── api.service.ts               # HTTP client wrapper (GET, POST)
│   │       ├── signalr.service.ts           # SignalR hub connection manager
│   │       └── tracker-state.service.ts     # Shared tracker state (signal store)
│   ├── features/
│   │   ├── dashboard/                       # Live dashboard
│   │   ├── control/                         # Tracker control panel
│   │   ├── charts/                          # Telemetry history charts
│   │   ├── power/                           # Power monitoring
│   │   └── alarms/                          # Alarm panel
│   └── shared/
│       ├── components/
│       │   └── sidebar/                     # Navigation sidebar
│       └── models/                          # TypeScript interfaces
│           ├── tracker-status.model.ts      # TrackerStatus, TrackerMode, TrackerState
│           ├── sensor-data.model.ts         # SensorData
│           ├── wind-data.model.ts           # WindData
│           ├── ups-status.model.ts          # UpsStatus, PowerSource, AtsStatus
│           ├── alarm-event.model.ts         # AlarmEvent, AlarmType, AlarmSeverity
│           ├── telemetry-snapshot.model.ts  # TelemetrySnapshot (full history entry)
│           └── power-status.model.ts        # PowerStatus, PowerHistoryEntry
└── environments/
    └── environment.ts                       # API URL: http://localhost:5000/api
```

## API Integration

### REST Endpoints

| Method | Endpoint | Used by |
|--------|----------|---------|
| GET | `/api/tracker/status` | Dashboard, Control |
| POST | `/api/tracker/command/move` | Control (manual mode) |
| POST | `/api/tracker/command/mode` | Control (mode toggle) |
| GET | `/api/telemetry/latest` | Dashboard |
| GET | `/api/telemetry/history?from=&to=&interval=` | Charts |
| GET | `/api/power/status` | Power |
| GET | `/api/power/history?from=&to=` | Power |
| GET | `/api/alarms/active` | Dashboard, Alarms |
| GET | `/api/alarms/history` | Alarms |

### SignalR Hubs

| Hub | Events | Used by |
|-----|--------|---------|
| `/hubs/tracker` | `OnStatusUpdate` | Dashboard, Control |
| `/hubs/telemetry` | `OnTelemetryUpdate` | Dashboard |
| `/hubs/alarms` | `OnAlarmEvent` | Dashboard, Alarms |

## Getting started

### Prerequisites

- Node.js 20+
- Backend API running on `http://localhost:5000` (see [solar-tracker-api](https://github.com/KubaKrychowski/solar-tracker-api))

### Run

```bash
npm install
ng serve
```

Open `http://localhost:4200`. The app defaults to dark mode.

### Build

```bash
ng build
```

Output in `dist/solar-tracker-web/`.

## Layout

- **Desktop** (>768px): permanent sidebar (220px) + main content
- **Mobile** (≤768px): collapsible sidebar (mat-sidenav) + app bar with hamburger menu
- **Theme**: dark mode default, toggle via sun/moon icon in header
