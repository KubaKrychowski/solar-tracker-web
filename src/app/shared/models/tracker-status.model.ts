export interface TrackerStatus {
  azimuth: number;
  elevation: number;
  targetAzimuth: number;
  targetElevation: number;
  mode: TrackerMode;
  state: TrackerState;
}

export type TrackerMode = 'auto' | 'manual' | 'parking';
export type TrackerState = 'idle' | 'moving' | 'parked' | 'error';
