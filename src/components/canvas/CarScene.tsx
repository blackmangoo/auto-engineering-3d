import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CarAssembly } from './CarAssembly';
import type {
  SubsystemType,
  TelemetryData,
  ViewerSettings,
  CameraPreset
} from '../../types/automotive';

interface CarSceneProps {
  currentSubsystem: SubsystemType;
  telemetry: TelemetryData;
  viewerSettings: ViewerSettings;
  scrollProgress: number;
  onFpsUpdate?: (fps: number) => void;
}

// Subsystem specific camera targets and eye positions
const CAMERA_PRESETS: Record<
  string,
  { position: [number, number, number]; target: [number, number, number]; fov: number }
> = {
  overview: { position: [4.8, 2.2, 5.2], target: [0, 0.5, 0], fov: 42 },
  chassis: { position: [4.2, 3.2, 4.0], target: [0, 0.8, 0], fov: 45 },
  engine: { position: [1.8, 1.4, 0.6], target: [0, 0.6, 0.25], fov: 36 },
  transmission: { position: [1.6, 1.3, 2.2], target: [0, 0.5, 1.3], fov: 36 },
  suspension: { position: [1.8, 0.8, -1.2], target: [1.0, 0.4, -1.35], fov: 38 },
  brakes: { position: [1.6, 0.65, -1.15], target: [1.02, 0.4, -1.38], fov: 32 },
  hvac: { position: [1.5, 1.2, -2.4], target: [0, 0.45, -1.7], fov: 38 },
  sandbox: { position: [5.2, 2.6, 4.8], target: [0, 0.5, 0], fov: 45 },

  // Manual camera angle presets
  side: { position: [5.8, 0.8, 0], target: [0, 0.6, 0], fov: 40 },
  front: { position: [0, 0.8, -5.8], target: [0, 0.5, 0], fov: 40 },
  top: { position: [0, 7.5, 0.01], target: [0, 0, 0], fov: 42 },
  isometric: { position: [4.5, 3.5, 4.5], target: [0, 0.5, 0], fov: 40 },
  default: { position: [4.8, 2.2, 5.2], target: [0, 0.5, 0], fov: 42 },
};

// Camera Controller that interpolates smoothly between preset targets or respects free orbit
function CameraRig({
  currentSubsystem,
  activePreset,
  autoRotate
}: {
  currentSubsystem: SubsystemType;
  activePreset: CameraPreset;
  autoRotate: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Determine active target configuration
  const activeConfig =
    activePreset !== 'default'
      ? CAMERA_PRESETS[activePreset] || CAMERA_PRESETS.overview
      : CAMERA_PRESETS[currentSubsystem] || CAMERA_PRESETS.overview;

  const targetPos = useMemo(() => new THREE.Vector3(...activeConfig.position), [activeConfig]);
  const targetLook = useMemo(() => new THREE.Vector3(...activeConfig.target), [activeConfig]);

  useFrame((_, delta) => {
    if (controlsRef.current) {
      // Smoothly slerp camera position towards target
      camera.position.lerp(targetPos, delta * 2.8);
      controlsRef.current.target.lerp(targetLook, delta * 3.2);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 - 0.04} // Don't go underneath floor
      minDistance={1.2}
      maxDistance={12}
      autoRotate={autoRotate}
      autoRotateSpeed={0.8}
    />
  );
}

// Real-time FPS Monitor inside canvas
function FpsTracker({ onFpsUpdate }: { onFpsUpdate?: (fps: number) => void }) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    if (now - lastTime.current >= 500) {
      const currentFps = (frameCount.current * 1000) / (now - lastTime.current);
      onFpsUpdate?.(currentFps);
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}

// Holographic Floor Grid with Cyberpunk / CAD Rings
function TechnicalFloor() {
  return (
    <group position={[0, -0.01, 0]}>
      {/* Floor Shadow Receiver */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color={0x07080c}
          roughness={0.9}
          metalness={0.2}
        />
      </mesh>

      {/* Primary CAD Grid */}
      <gridHelper
        args={[30, 60, 0x00e5ff, 0x151f30]}
        position={[0, 0.005, 0]}
      />

      {/* Concentric Telemetry Target Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.8, 2.84, 64]} />
        <meshBasicMaterial color={0x00e5ff} transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[4.5, 4.53, 64]} />
        <meshBasicMaterial color={0x3b82f6} transparent opacity={0.25} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[6.2, 6.22, 64]} />
        <meshBasicMaterial color={0xff5e1a} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

export const CarScene: React.FC<CarSceneProps> = ({
  currentSubsystem,
  telemetry,
  viewerSettings,
  scrollProgress,
  onFpsUpdate
}) => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto bg-[#07080c]">
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false
        }}
      >
        <PerspectiveCamera makeDefault position={[4.8, 2.2, 5.2]} fov={42} />

        {/* Ambient & Directional Key Lighting */}
        <ambientLight intensity={0.45} />

        {/* Main Overhead Key Light */}
        <directionalLight
          position={[6, 12, 6]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-bias={-0.0003}
        />

        {/* Rim Light (Cyan tint from rear/top) */}
        <directionalLight
          position={[-6, 8, -6]}
          intensity={1.2}
          color={0x00e5ff}
        />

        {/* Front Warm Accent Fill */}
        <directionalLight
          position={[0, 3, -8]}
          intensity={0.8}
          color={0xffaa55}
        />

        {/* Underbody Neon Ground Glow */}
        <pointLight
          position={[0, 0.15, 0]}
          intensity={2.5}
          distance={4.5}
          color={0x00e5ff}
        />

        {/* Underbody Engine Accent Glow */}
        <pointLight
          position={[0, 0.4, 0.4]}
          intensity={telemetry.throttle * 3.5}
          distance={3.0}
          color={0xff5e1a}
        />

        {/* Technical Floor */}
        <TechnicalFloor />

        {/* Full Vehicle Assembly & Subsystems */}
        <CarAssembly
          telemetry={telemetry}
          viewerSettings={viewerSettings}
          scrollProgress={scrollProgress}
        />

        {/* Interactive Camera Controls Rig */}
        <CameraRig
          currentSubsystem={currentSubsystem}
          activePreset={viewerSettings.activeCameraPreset}
          autoRotate={viewerSettings.autoRotate}
        />

        {/* FPS Tracker */}
        <FpsTracker onFpsUpdate={onFpsUpdate} />
      </Canvas>
    </div>
  );
};
