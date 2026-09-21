import React, { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RealisticCarModel } from './RealisticCarModel';
import { RealisticEngine } from './RealisticEngine';
import { TransmissionModel } from './TransmissionModel';
import { SuspensionModel } from './SuspensionModel';
import { BrakeModel } from './BrakeModel';
import { HVACModel } from './HVACModel';
import { WindTunnelParticles } from './WindTunnelParticles';
import type { TelemetryData, ViewerSettings } from '../../types/automotive';

interface CarAssemblyProps {
  telemetry: TelemetryData;
  viewerSettings: ViewerSettings;
  scrollProgress: number;
}

export const CarAssembly: React.FC<CarAssemblyProps> = ({
  telemetry,
  viewerSettings,
  scrollProgress
}) => {
  const rootRef = useRef<THREE.Group>(null);

  // Sub-assembly groups for exploded view kinematics
  const chassisFrameRef = useRef<THREE.Group>(null);
  const engineBayRef = useRef<THREE.Group>(null);
  const transmissionBayRef = useRef<THREE.Group>(null);
  const hvacBayRef = useRef<THREE.Group>(null);

  const frontLeftCornerRef = useRef<THREE.Group>(null);
  const frontRightCornerRef = useRef<THREE.Group>(null);
  const rearLeftCornerRef = useRef<THREE.Group>(null);
  const rearRightCornerRef = useRef<THREE.Group>(null);

  // Effective exploded separation factor
  const effectiveExplode = useMemo(() => {
    let scrollExplode = 0;
    if (scrollProgress >= 0.15 && scrollProgress <= 0.35) {
      scrollExplode = Math.sin(((scrollProgress - 0.15) / 0.2) * Math.PI);
    }
    return Math.max(scrollExplode, viewerSettings.explodedDistance);
  }, [scrollProgress, viewerSettings.explodedDistance]);

  // Chassis Materials
  const materials = useMemo(() => {
    const isXRay = viewerSettings.xRayMode;
    const isWire = viewerSettings.wireframe;

    return {
      carbonFiber: new THREE.MeshStandardMaterial({
        color: 0x111317,
        roughness: 0.5,
        metalness: 0.7,
        wireframe: isWire,
        transparent: isXRay,
        opacity: isXRay ? 0.3 : 1.0,
      }),
      chassisTubes: new THREE.MeshStandardMaterial({
        color: 0x3d4450,
        metalness: 0.85,
        roughness: 0.3,
        wireframe: isWire,
        transparent: isXRay,
        opacity: isXRay ? 0.45 : 1.0,
      }),
    };
  }, [viewerSettings.xRayMode, viewerSettings.wireframe]);

  const wheelBase = 2.65;
  const trackWidth = 1.78;

  // Frame kinematics
  useFrame(() => {
    const exp = effectiveExplode;

    // Engine bay lifts and moves slightly forward
    if (engineBayRef.current) {
      engineBayRef.current.position.y = THREE.MathUtils.lerp(
        engineBayRef.current.position.y,
        0.58 + exp * 0.9,
        0.1
      );
      engineBayRef.current.position.z = THREE.MathUtils.lerp(
        engineBayRef.current.position.z,
        0.35 + exp * 0.4,
        0.1
      );
    }

    // Transmission moves rearward
    if (transmissionBayRef.current) {
      transmissionBayRef.current.position.z = THREE.MathUtils.lerp(
        transmissionBayRef.current.position.z,
        1.35 + exp * 1.6,
        0.1
      );
    }

    // Front HVAC slides forward
    if (hvacBayRef.current) {
      hvacBayRef.current.position.z = THREE.MathUtils.lerp(
        hvacBayRef.current.position.z,
        -1.75 - exp * 1.7,
        0.1
      );
    }

    // Four corners expand laterally outward
    const lateralShift = exp * 1.35;
    if (frontLeftCornerRef.current) {
      frontLeftCornerRef.current.position.x = THREE.MathUtils.lerp(
        frontLeftCornerRef.current.position.x,
        -trackWidth / 2 - lateralShift,
        0.1
      );
    }
    if (frontRightCornerRef.current) {
      frontRightCornerRef.current.position.x = THREE.MathUtils.lerp(
        frontRightCornerRef.current.position.x,
        trackWidth / 2 + lateralShift,
        0.1
      );
    }
    if (rearLeftCornerRef.current) {
      rearLeftCornerRef.current.position.x = THREE.MathUtils.lerp(
        rearLeftCornerRef.current.position.x,
        -trackWidth / 2 - lateralShift,
        0.1
      );
    }
    if (rearRightCornerRef.current) {
      rearRightCornerRef.current.position.x = THREE.MathUtils.lerp(
        rearRightCornerRef.current.position.x,
        trackWidth / 2 + lateralShift,
        0.1
      );
    }
  });

  return (
    <group ref={rootRef}>
      {/* Aerodynamic Wind Tunnel Streamlines */}
      <WindTunnelParticles
        visible={viewerSettings.showAeroStreamlines}
        speedKmh={telemetry.speedKmh}
      />

      {/* 1. PHOTOREALISTIC FERRARI 458 BODYWORK & WHEELS */}
      <Suspense fallback={null}>
        <RealisticCarModel
          telemetry={telemetry}
          viewerSettings={viewerSettings}
          effectiveExplode={effectiveExplode}
        />
      </Suspense>

      {/* 2. INTERNAL SPACEFRAME & STRUCTURAL CHASSIS TUBES */}
      <group ref={chassisFrameRef}>
        {/* Floor Pan Underbody Shield */}
        <mesh position={[0, 0.15, 0]} material={materials.carbonFiber} receiveShadow>
          <boxGeometry args={[1.5, 0.04, 4.2]} />
        </mesh>

        {/* Front Suspension Subframe Cradles */}
        <mesh position={[0, 0.32, -wheelBase / 2]} material={materials.chassisTubes}>
          <boxGeometry args={[1.05, 0.15, 0.45]} />
        </mesh>

        {/* Rear Powertrain Subframe Cradle */}
        <mesh position={[0, 0.38, wheelBase / 2]} material={materials.chassisTubes}>
          <boxGeometry args={[1.1, 0.22, 0.65]} />
        </mesh>

        {/* Cockpit Safety Rollcage Tubes */}
        <mesh position={[-0.58, 0.72, -0.1]} material={materials.chassisTubes}>
          <boxGeometry args={[0.045, 0.8, 1.8]} />
        </mesh>
        <mesh position={[0.58, 0.72, -0.1]} material={materials.chassisTubes}>
          <boxGeometry args={[0.045, 0.8, 1.8]} />
        </mesh>
      </group>

      {/* 3. FRONT HVAC & THERMAL MANAGEMENT PACKAGE */}
      <group ref={hvacBayRef} position={[0, 0.42, -1.75]}>
        <HVACModel
          compressorRpm={telemetry.rpm * 0.45}
          cabinTempC={telemetry.cabinTempC}
          exploded={effectiveExplode}
          wireframe={viewerSettings.wireframe}
          xRayMode={viewerSettings.xRayMode}
        />
      </group>

      {/* 4. MID-MOUNTED 3.0L TWIN-TURBO V6 POWERPLANT */}
      <group ref={engineBayRef} position={[0, 0.58, 0.35]}>
        <RealisticEngine
          rpm={telemetry.rpm}
          throttle={telemetry.throttle}
          exploded={effectiveExplode}
          wireframe={viewerSettings.wireframe}
          xRayMode={viewerSettings.xRayMode}
          cutaway={true}
        />
      </group>

      {/* 5. 7-SPEED DUAL-CLUTCH TRANSAXLE & DIFFERENTIAL */}
      <group ref={transmissionBayRef} position={[0, 0.48, 1.35]}>
        <TransmissionModel
          gear={telemetry.gear}
          inputRpm={telemetry.rpm}
          exploded={effectiveExplode}
          wireframe={viewerSettings.wireframe}
          xRayMode={viewerSettings.xRayMode}
          clutchEngagement={telemetry.gear === 0 ? 0 : 0.98}
        />
      </group>

      {/* 6. FOUR WHEEL CORNERS & SUSPENSION / BRAKE SUBASSEMBLIES */}
      {/* Front Left Corner */}
      <group
        ref={frontLeftCornerRef}
        position={[-trackWidth / 2, 0.38, -wheelBase / 2]}
      >
        <group position={[0.18, 0, 0]}>
          <SuspensionModel
            travelMm={telemetry.suspensionTravelMm}
            roadRoughness={telemetry.roadRoughness}
            exploded={effectiveExplode}
            wireframe={viewerSettings.wireframe}
            xRayMode={viewerSettings.xRayMode}
          />
        </group>
        <group position={[0.08, 0, 0]}>
          <BrakeModel
            pedalPressure={telemetry.brakePedal}
            brakeTempC={telemetry.brakeTempC}
            wheelSpeedRpm={(telemetry.speedKmh / 3.6 / 0.35) * 9.55}
            exploded={effectiveExplode}
            wireframe={viewerSettings.wireframe}
            xRayMode={viewerSettings.xRayMode}
          />
        </group>
      </group>

      {/* Front Right Corner */}
      <group
        ref={frontRightCornerRef}
        position={[trackWidth / 2, 0.38, -wheelBase / 2]}
        rotation={[0, Math.PI, 0]}
      >
        <group position={[0.18, 0, 0]}>
          <SuspensionModel
            travelMm={telemetry.suspensionTravelMm}
            roadRoughness={telemetry.roadRoughness}
            exploded={effectiveExplode}
            wireframe={viewerSettings.wireframe}
            xRayMode={viewerSettings.xRayMode}
          />
        </group>
        <group position={[0.08, 0, 0]}>
          <BrakeModel
            pedalPressure={telemetry.brakePedal}
            brakeTempC={telemetry.brakeTempC}
            wheelSpeedRpm={(telemetry.speedKmh / 3.6 / 0.35) * 9.55}
            exploded={effectiveExplode}
            wireframe={viewerSettings.wireframe}
            xRayMode={viewerSettings.xRayMode}
          />
        </group>
      </group>
    </group>
  );
};
