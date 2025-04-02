declare global {
  interface MediaTrackConstraintSet {
    zoom?: number | { ideal: number } | { exact: number } | { min: number; max: number };
    torch?: boolean | { exact: boolean };
  }

  interface MediaTrackCapabilities {
    zoom?: {
      min: number;
      max: number;
      step?: number;
    };
    torch?: boolean;
  }

  interface MediaTrackSettings {
    zoom?: number;
    torch?: boolean;
  }

  interface MediaTrackConstraintSet {
    zoom?: ConstrainDouble;
    torch?: ConstrainBoolean;
  }
}

export {};