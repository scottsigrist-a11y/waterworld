export interface LatLng {
  lat: number;
  lng: number;
}

export interface PathPoint extends LatLng {
  distanceFromStart: number; // in miles
  timestamp: number;
}

export type FlightMode = 'patrol' | 'circle';

export interface DroppedEgg {
  id: string;
  lat: number;
  lng: number;
  droppedAt: number;
}

export interface SeagullState {
  lat: number;
  lng: number;
  heading: number; // in degrees, 0 = North
  progress: number; // 0 to 1 along path
  direction: 'forward' | 'backward';
  mode: FlightMode;
  circleStartTime: number | null;
  circleTakeoffPoint: LatLng | null;
  circleCenter: LatLng | null;
  circleRadiusMiles: number;
  circleInitialAngle?: number;
  circleDirection?: 'cw' | 'ccw';
}

export interface FloodedArea {
  id: string;
  polygon: LatLng[];
  addedAt: number;
  areaSqMiles: number;
  waveSeed: number;
}

export interface GameState {
  score: number; // total square miles flooded (contributes only once)
  floodableArea: number; // square miles ready to be flooded
  isFlooding: boolean; // whether "FLOODING" 1s banner is active
  floodingLineActive: boolean; // whether the white line is turning blue
  zoomLevel: number;
}
