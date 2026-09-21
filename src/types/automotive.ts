export type SubsystemType =
  | 'overview'
  | 'chassis'
  | 'engine'
  | 'transmission'
  | 'suspension'
  | 'brakes'
  | 'hvac'
  | 'sandbox';

export interface TelemetryData {
  rpm: number;
  gear: number; // -1 = R, 0 = N, 1-6
  speedKmh: number;
  engineTempC: number;
  oilPressureBar: number;
  turboBoostBar: number;
  coolantTempC: number;
  brakeTempC: number;
  brakePressurePsi: number;
  suspensionTravelMm: number;
  suspensionVelocityMps: number;
  hvacHighSidePsi: number;
  hvacLowSidePsi: number;
  cabinTempC: number;
  ambientTempC: number;
  throttle: number; // 0 to 1
  brakePedal: number; // 0 to 1
  clutchEngagement: number; // 0 to 1
  steeringAngleDeg: number; // -45 to +45
  roadRoughness: number; // 0 to 1
  gForceLat: number;
  gForceLong: number;
}

export type CameraPreset =
  | 'default'
  | 'side'
  | 'front'
  | 'rear'
  | 'top'
  | 'isometric'
  | 'engine'
  | 'transmission'
  | 'suspension'
  | 'brakes'
  | 'hvac';

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface ViewerSettings {
  explodedDistance: number; // 0 to 1
  xRayMode: boolean;
  wireframe: boolean;
  showAeroStreamlines: boolean;
  autoRotate: boolean;
  soundEnabled: boolean;
  selectedSubsystem: SubsystemType;
  activeCameraPreset: CameraPreset;
  debugOverlay?: boolean;
}

export interface SystemInfo {
  id: SubsystemType;
  title: string;
  category: string;
  tagline: string;
  description: string;
  principles: string[];
  keyComponents: { name: string; desc: string; spec: string }[];
  engineeringTradeoffs: { title: string; pro: string; con: string }[];
  metrics: { label: string; value: string; unit: string }[];
}

export interface EngineParams {
  rpm: number;
  throttle: number;
  boreMm?: number;
  strokeMm?: number;
  conRodLengthMm?: number;
  cylinderCount?: number;
  compressionRatio?: number;
  fuelPressureBar?: number;
}

export interface TransmissionParams {
  gear: number;
  clutchA: number; // 0 to 1
  clutchB: number; // 0 to 1
  inputRpm: number;
  gearRatios?: number[];
  finalDriveRatio?: number;
}

export interface SuspensionParams {
  travelMm: number;
  dampingRatio: number;
  camberDeg: number;
  toeDeg: number;
  springRateNmm: number;
  antiRollStiffness: number;
}

export interface BrakeParams {
  pedalPressure: number; // 0 to 1
  discTempC: number;
  rotorDiameterMm: number;
  caliperPistons: number;
  padFrictionCoeff: number;
  brakeBiasFront: number; // e.g. 0.62
}

export interface HVACParams {
  compressorSpeedRpm: number;
  targetCabinTempC: number;
  ambientTempC: number;
  refrigerantType: 'R134a' | 'R1234yf' | 'CO2';
  blowerSpeed: number; // 0 to 1
  expansionValveOpening: number; // 0 to 1
}
