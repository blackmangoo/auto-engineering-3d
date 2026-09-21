import { useState, useEffect, useCallback } from 'react';
import { CarScene } from './components/canvas/CarScene';
import { Navbar } from './components/ui/Navbar';
import { TelemetryHUD } from './components/ui/TelemetryHUD';
import { SystemDetailCard } from './components/ui/SystemDetailCard';
import { InteractiveControls } from './components/ui/InteractiveControls';
import { ScrollStorySections } from './components/ui/ScrollStorySections';
import type {
  SubsystemType,
  TelemetryData,
  ViewerSettings,
  CameraPreset
} from './types/automotive';
import { soundEngine } from './utils/soundEngine';

export function App() {
  // Active engineering subsystem being inspected
  const [currentSubsystem, setCurrentSubsystem] = useState<SubsystemType>('overview');

  // Overall scroll progression (0.0 to 1.0)
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // FPS readout from Three.js render loop
  const [fps, setFps] = useState<number>(60);

  // Comprehensive vehicle dynamics & telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    rpm: 2400,
    gear: 3,
    speedKmh: 110,
    engineTempC: 92,
    oilPressureBar: 5.8,
    turboBoostBar: 1.45,
    coolantTempC: 88,
    brakeTempC: 180,
    brakePressurePsi: 0,
    suspensionTravelMm: 4.2,
    suspensionVelocityMps: 0.12,
    hvacHighSidePsi: 235,
    hvacLowSidePsi: 32,
    cabinTempC: 21.5,
    ambientTempC: 32.0,
    throttle: 0.25,
    brakePedal: 0,
    clutchEngagement: 0.98,
    steeringAngleDeg: 0,
    roadRoughness: 0.35,
    gForceLat: 0.42,
    gForceLong: 0.65,
  });

  // 3D Visualizer settings
  const [viewerSettings, setViewerSettings] = useState<ViewerSettings>({
    explodedDistance: 0,
    xRayMode: false,
    wireframe: false,
    showAeroStreamlines: true,
    autoRotate: false,
    soundEnabled: false,
    selectedSubsystem: 'overview',
    activeCameraPreset: 'default',
  });

  // Partial update helper for telemetry
  const handleUpdateTelemetry = useCallback((partial: Partial<TelemetryData>) => {
    setTelemetry((prev) => ({ ...prev, ...partial }));
  }, []);

  // Partial update helper for viewer settings
  const handleUpdateViewerSettings = useCallback((partial: Partial<ViewerSettings>) => {
    setViewerSettings((prev) => {
      const next = { ...prev, ...partial };
      // Handle sound toggle
      if (partial.soundEnabled !== undefined) {
        soundEngine.setEnabled(partial.soundEnabled);
      }
      return next;
    });
  }, []);

  // Subsystem selection handler (also scrolls smoothly to section if clicked from navbar)
  const handleSelectSubsystem = useCallback((id: SubsystemType) => {
    setCurrentSubsystem(id);
    const targetElement = document.getElementById(`section-${id}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Camera preset handler
  const handleSelectCameraPreset = useCallback((preset: CameraPreset) => {
    setViewerSettings((prev) => ({ ...prev, activeCameraPreset: preset }));
  }, []);

  // Real-time physics / thermodynamic loop update
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const updatePhysics = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setTelemetry((prev) => {
        // Natural thermal dissipation for brakes
        let newBrakeTemp = prev.brakeTempC;
        if (prev.brakePedal === 0 && newBrakeTemp > 120) {
          newBrakeTemp = Math.max(120, newBrakeTemp - dt * 25);
        }

        // Suspension oscillation simulator
        const osc = Math.sin(now * 0.008 * (1 + prev.roadRoughness * 2)) * 6.5 * prev.roadRoughness;

        // Sound engine telemetry update
        soundEngine.updateTelemetry(prev.rpm, prev.throttle, prev.brakePedal, prev.speedKmh);

        return {
          ...prev,
          brakeTempC: newBrakeTemp,
          suspensionTravelMm: osc,
        };
      });

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#07080c] text-white overflow-x-hidden select-none font-sans">
      {/* 1. 3D WebGL Canvas Layer (Fixed full-screen backdrop) */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <CarScene
          currentSubsystem={currentSubsystem}
          telemetry={telemetry}
          viewerSettings={viewerSettings}
          scrollProgress={scrollProgress}
          onFpsUpdate={setFps}
        />
      </div>

      {/* 2. Top Navigation Bar */}
      <Navbar
        currentSubsystem={currentSubsystem}
        onSelectSubsystem={handleSelectSubsystem}
        viewerSettings={viewerSettings}
        onUpdateViewerSettings={handleUpdateViewerSettings}
        fps={fps}
      />

      {/* 3. Live Telemetry HUD (Right side) */}
      <TelemetryHUD
        currentSubsystem={currentSubsystem}
        telemetry={telemetry}
      />

      {/* 4. Active Subsystem Technical Deep Dive Card (Left side) */}
      <SystemDetailCard currentSubsystem={currentSubsystem} />

      {/* 5. Bottom Interactive Engineering Controls Deck */}
      <InteractiveControls
        currentSubsystem={currentSubsystem}
        telemetry={telemetry}
        onUpdateTelemetry={handleUpdateTelemetry}
        viewerSettings={viewerSettings}
        onUpdateViewerSettings={handleUpdateViewerSettings}
        onSelectCameraPreset={handleSelectCameraPreset}
      />

      {/* 6. Scroll-Driven Storytelling Sections (Foreground Scroll Content) */}
      <ScrollStorySections
        currentSubsystem={currentSubsystem}
        onSubsystemChange={setCurrentSubsystem}
        onScrollProgress={setScrollProgress}
      />
    </div>
  );
}

export default App;
