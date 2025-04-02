declare global {
  interface MediaTrackConstraintSet {
    zoom?: number | { ideal: number } | { exact: number } | { min: number; max: number } | ConstrainDouble;
    torch?: boolean | { exact: boolean } | ConstrainBoolean;
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
}

export {};
