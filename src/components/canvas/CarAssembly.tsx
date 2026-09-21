import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { EngineModel } from './EngineModel';
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

  // Structural Sub-assembly Groups for Exploded View Kinematics
  const bodyPanelsRef = useRef<THREE.Group>(null);
  const chassisFrameRef = useRef<THREE.Group>(null);
  const engineBayRef = useRef<THREE.Group>(null);
  const transmissionBayRef = useRef<THREE.Group>(null);
  const hvacBayRef = useRef<THREE.Group>(null);

  const frontLeftCornerRef = useRef<THREE.Group>(null);
  const frontRightCornerRef = useRef<THREE.Group>(null);
  const rearLeftCornerRef = useRef<THREE.Group>(null);
  const rearRightCornerRef = useRef<THREE.Group>(null);

  // Wheel rotation refs
  const flWheelRef = useRef<THREE.Group>(null);
  const frWheelRef = useRef<THREE.Group>(null);
  const rlWheelRef = useRef<THREE.Group>(null);
  const rrWheelRef = useRef<THREE.Group>(null);

  // Effective exploded factor combines scroll progress and manual exploded slider
  // When scrolling in section 2 ('chassis'), exploded view smoothly expands
  const effectiveExplode = useMemo(() => {
    let scrollExplode = 0;
    if (scrollProgress >= 0.15 && scrollProgress <= 0.35) {
      // Peaks at 0.25
      scrollExplode = Math.sin(((scrollProgress - 0.15) / 0.2) * Math.PI);
    }
    return Math.max(scrollExplode, viewerSettings.explodedDistance);
  }, [scrollProgress, viewerSettings.explodedDistance]);

  // Dynamic Materials
  const materials = useMemo(() => {
    const isXRay = viewerSettings.xRayMode;
    const isWire = viewerSettings.wireframe;

    return {
      bodywork: new THREE.MeshPhysicalMaterial({
        color: 0x121722,
        metalness: 0.9,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 0.9,
        wireframe: isWire,
        transparent: isXRay,
        opacity: isXRay ? 0.25 : 0.95,
      }),
      carbonFiber: new THREE.MeshStandardMaterial({
        color: 0x111317,
        roughness: 0.5,
        metalness: 0.7,
        wireframe: isWire,
        transparent: isXRay,
        opacity: isXRay ? 0.3 : 1.0,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x051628,
        metalness: 0.1,
        roughness: 0.05,
        transmission: isXRay ? 0.9 : 0.75,
        transparent: true,
        opacity: isXRay ? 0.2 : 0.55,
        wireframe: isWire,
      }),
      chassisTubes: new THREE.MeshStandardMaterial({
        color: 0x3d4450,
        metalness: 0.85,
        roughness: 0.3,
        wireframe: isWire,
        transparent: isXRay,
        opacity: isXRay ? 0.5 : 1.0,
      }),
      tireRubber: new THREE.MeshStandardMaterial({
        color: 0x161719,
        roughness: 0.85,
        metalness: 0.1,
        wireframe: isWire,
      }),
      alloyRim: new THREE.MeshStandardMaterial({
        color: 0xd8dde8,
        metalness: 0.95,
        roughness: 0.15,
        wireframe: isWire,
      }),
      accentCyan: new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: isWire,
      }),
      headlightGlow: new THREE.MeshBasicMaterial({
        color: 0x80f4ff,
      }),
      taillightGlow: new THREE.MeshBasicMaterial({
        color: 0xff1744,
      }),
    };
  }, [viewerSettings.xRayMode, viewerSettings.wireframe]);

  // Geometry dimensions for car layout
  const wheelBase = 2.75; // Front to rear axle distance
  const trackWidth = 1.85; // Left to right wheel centerline

  // Smooth frame updates for animation & explosion
  useFrame((_, delta) => {
    // 1. Wheel rotation proportional to speed
    const wheelRotSpeed = (telemetry.speedKmh / 3.6 / 0.35) * delta; // radius ~0.35m
    if (flWheelRef.current) flWheelRef.current.rotation.x += wheelRotSpeed;
    if (frWheelRef.current) frWheelRef.current.rotation.x += wheelRotSpeed;
    if (rlWheelRef.current) rlWheelRef.current.rotation.x += wheelRotSpeed;
    if (rrWheelRef.current) rrWheelRef.current.rotation.x += wheelRotSpeed;

    // 2. Smooth Lerp for Exploded View separation
    const exp = effectiveExplode;

    // Body panels float upward
    if (bodyPanelsRef.current) {
      bodyPanelsRef.current.position.y = THREE.MathUtils.lerp(
        bodyPanelsRef.current.position.y,
        exp * 2.2,
        0.1
      );
    }

    // Engine bay lifts and moves slightly forward
    if (engineBayRef.current) {
      engineBayRef.current.position.y = THREE.MathUtils.lerp(
        engineBayRef.current.position.y,
        exp * 0.8,
        0.1
      );
      engineBayRef.current.position.z = THREE.MathUtils.lerp(
        engineBayRef.current.position.z,
        exp * 0.3,
        0.1
      );
    }

    // Transmission moves rearward
    if (transmissionBayRef.current) {
      transmissionBayRef.current.position.z = THREE.MathUtils.lerp(
        transmissionBayRef.current.position.z,
        1.25 + exp * 1.5,
        0.1
      );
    }

    // Front HVAC slides forward
    if (hvacBayRef.current) {
      hvacBayRef.current.position.z = THREE.MathUtils.lerp(
        hvacBayRef.current.position.z,
        -1.7 - exp * 1.6,
        0.1
      );
    }

    // Four corners expand laterally outward
    const lateralShift = exp * 1.4;
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

  // Wheel Mesh Component
  const renderWheel = (ref: React.RefObject<THREE.Group | null>) => (
    <group ref={ref}>
      {/* Tire */}
      <mesh material={materials.tireRubber} castShadow receiveShadow>
        <torusGeometry args={[0.34, 0.12, 16, 32]} />
      </mesh>
      {/* Outer Rim Ring */}
      <mesh material={materials.alloyRim} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.22, 24]} />
      </mesh>
      {/* 5-Twin Spoke Rims */}
      {Array.from({ length: 5 }).map((_, idx) => (
        <mesh
          key={idx}
          material={materials.alloyRim}
          rotation={[0, 0, (idx * Math.PI * 2) / 5]}
        >
          <boxGeometry args={[0.04, 0.48, 0.08]} />
        </mesh>
      ))}
      {/* Center Nut Accent */}
      <mesh material={materials.accentCyan} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.24, 6]} />
      </mesh>
    </group>
  );

  return (
    <group ref={rootRef}>
      {/* Aerodynamic Wind Tunnel Streamlines */}
      <WindTunnelParticles
        visible={viewerSettings.showAeroStreamlines}
        speedKmh={telemetry.speedKmh}
      />

      {/* 1. AERODYNAMIC SUPERCAR BODY PANELS (Elevates on explode) */}
      <group ref={bodyPanelsRef}>
        {/* Main Monocoque Cockpit & Roof */}
        <mesh position={[0, 0.92, -0.1]} material={materials.bodywork} castShadow>
          <boxGeometry args={[1.52, 0.55, 2.2]} />
        </mesh>

        {/* Front Hood Slope */}
        <mesh
          position={[0, 0.65, -1.5]}
          rotation={[0.22, 0, 0]}
          material={materials.bodywork}
          castShadow
        >
          <boxGeometry args={[1.65, 0.25, 1.6]} />
        </mesh>

        {/* Front Nose & Splitter */}
        <mesh position={[0, 0.32, -2.35]} material={materials.carbonFiber} castShadow>
          <boxGeometry args={[1.78, 0.08, 0.55]} />
        </mesh>

        {/* Aerodynamic Side Air Pods / Intakes */}
        <mesh position={[-0.92, 0.52, 0.2]} material={materials.bodywork} castShadow>
          <boxGeometry args={[0.28, 0.45, 1.8]} />
        </mesh>
        <mesh position={[0.92, 0.52, 0.2]} material={materials.bodywork} castShadow>
          <boxGeometry args={[0.28, 0.45, 1.8]} />
        </mesh>

        {/* Windshield & Canopy Glass */}
        <mesh
          position={[0, 1.05, -0.55]}
          rotation={[0.55, 0, 0]}
          material={materials.glass}
        >
          <planeGeometry args={[1.35, 1.05]} />
        </mesh>
        <mesh
          position={[0, 1.16, 0.25]}
          rotation={[-0.15, 0, 0]}
          material={materials.glass}
        >
          <planeGeometry args={[1.28, 0.85]} />
        </mesh>

        {/* Rear Engine Cover with Louvers */}
        <mesh
          position={[0, 0.78, 1.3]}
          rotation={[-0.18, 0, 0]}
          material={materials.bodywork}
          castShadow
        >
          <boxGeometry args={[1.55, 0.18, 1.4]} />
        </mesh>

        {/* Active DRS Rear Wing & Endplates */}
        <group position={[0, 1.15, 2.25]}>
          <mesh material={materials.carbonFiber} castShadow>
            <boxGeometry args={[1.75, 0.05, 0.35]} />
          </mesh>
          {/* Wing pylons */}
          <mesh position={[-0.45, -0.22, 0]} material={materials.chassisTubes}>
            <boxGeometry args={[0.04, 0.4, 0.08]} />
          </mesh>
          <mesh position={[0.45, -0.22, 0]} material={materials.chassisTubes}>
            <boxGeometry args={[0.04, 0.4, 0.08]} />
          </mesh>
        </group>

        {/* Rear Venturi Aerodynamic Diffuser */}
        <mesh
          position={[0, 0.25, 2.15]}
          rotation={[-0.24, 0, 0]}
          material={materials.carbonFiber}
        >
          <boxGeometry args={[1.68, 0.12, 0.75]} />
        </mesh>

        {/* Headlight LED strips */}
        <mesh position={[-0.65, 0.62, -2.25]} material={materials.headlightGlow}>
          <boxGeometry args={[0.32, 0.04, 0.08]} />
        </mesh>
        <mesh position={[0.65, 0.62, -2.25]} material={materials.headlightGlow}>
          <boxGeometry args={[0.32, 0.04, 0.08]} />
        </mesh>

        {/* Taillight LED Lightbar */}
        <mesh position={[0, 0.65, 2.38]} material={materials.taillightGlow}>
          <boxGeometry args={[1.5, 0.035, 0.04]} />
        </mesh>
      </group>

      {/* 2. INTERNAL SPACEFRAME & STRUCTURAL CHASSIS TUBES */}
      <group ref={chassisFrameRef}>
        {/* Floor Pan Underbody Shield */}
        <mesh position={[0, 0.18, 0]} material={materials.carbonFiber} receiveShadow>
          <boxGeometry args={[1.6, 0.04, 4.4]} />
        </mesh>

        {/* Front Suspension Subframe Cradles */}
        <mesh position={[0, 0.35, -wheelBase / 2]} material={materials.chassisTubes}>
          <boxGeometry args={[1.1, 0.15, 0.45]} />
        </mesh>

        {/* Rear Powertrain Subframe Cage */}
        <mesh position={[0, 0.45, wheelBase / 2]} material={materials.chassisTubes}>
          <boxGeometry args={[1.15, 0.25, 0.65]} />
        </mesh>

        {/* Cockpit Safety Rollcage Hoops */}
        <mesh position={[-0.62, 0.75, 0]} material={materials.chassisTubes}>
          <boxGeometry args={[0.05, 0.85, 1.9]} />
        </mesh>
        <mesh position={[0.62, 0.75, 0]} material={materials.chassisTubes}>
          <boxGeometry args={[0.05, 0.85, 1.9]} />
        </mesh>
      </group>

      {/* 3. FRONT HVAC & THERMAL MANAGEMENT BAY */}
      <group ref={hvacBayRef} position={[0, 0.45, -1.7]}>
        <HVACModel
          compressorRpm={telemetry.rpm * 0.45}
          cabinTempC={telemetry.cabinTempC}
          exploded={effectiveExplode}
          wireframe={viewerSettings.wireframe}
          xRayMode={viewerSettings.xRayMode}
        />
      </group>

      {/* 4. MID-MOUNTED 3.0L TWIN-TURBO V6 / I4 ENGINE */}
      <group ref={engineBayRef} position={[0, 0.58, 0.25]}>
        <EngineModel
          rpm={telemetry.rpm}
          throttle={telemetry.throttle}
          exploded={effectiveExplode}
          wireframe={viewerSettings.wireframe}
          xRayMode={viewerSettings.xRayMode}
          cutaway={true}
        />
      </group>

      {/* 5. 7-SPEED DUAL-CLUTCH TRANSAXLE & DIFFERENTIAL */}
      <group ref={transmissionBayRef} position={[0, 0.52, 1.25]}>
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
        position={[-trackWidth / 2, 0.4, -wheelBase / 2]}
      >
        <group position={[0.2, 0, 0]}>
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
        <group position={[-0.05, 0, 0]}>
          {renderWheel(flWheelRef)}
        </group>
      </group>

      {/* Front Right Corner */}
      <group
        ref={frontRightCornerRef}
        position={[trackWidth / 2, 0.4, -wheelBase / 2]}
        rotation={[0, Math.PI, 0]}
      >
        <group position={[0.2, 0, 0]}>
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
        <group position={[-0.05, 0, 0]}>
          {renderWheel(frWheelRef)}
        </group>
      </group>

      {/* Rear Left Corner */}
      <group
        ref={rearLeftCornerRef}
        position={[-trackWidth / 2, 0.4, wheelBase / 2]}
      >
        <group position={[0.2, 0, 0]}>
          <SuspensionModel
            travelMm={telemetry.suspensionTravelMm * 0.85}
            roadRoughness={telemetry.roadRoughness}
            exploded={effectiveExplode}
            wireframe={viewerSettings.wireframe}
            xRayMode={viewerSettings.xRayMode}
          />
        </group>
        <group position={[0.08, 0, 0]}>
          <BrakeModel
            pedalPressure={telemetry.brakePedal}
            brakeTempC={telemetry.brakeTempC * 0.8}
            wheelSpeedRpm={(telemetry.speedKmh / 3.6 / 0.35) * 9.55}
            exploded={effectiveExplode}
            wireframe={viewerSettings.wireframe}
            xRayMode={viewerSettings.xRayMode}
          />
        </group>
        <group position={[-0.05, 0, 0]}>
          {renderWheel(rlWheelRef)}
        </group>
      </group>

      {/* Rear Right Corner */}
      <group
        ref={rearRightCornerRef}
        position={[trackWidth / 2, 0.4, wheelBase / 2]}
        rotation={[0, Math.PI, 0]}
      >
        <group position={[0.2, 0, 0]}>
          <SuspensionModel
            travelMm={telemetry.suspensionTravelMm * 0.85}
            roadRoughness={telemetry.roadRoughness}
            exploded={effectiveExplode}
            wireframe={viewerSettings.wireframe}
            xRayMode={viewerSettings.xRayMode}
          />
        </group>
        <group position={[0.08, 0, 0]}>
          <BrakeModel
            pedalPressure={telemetry.brakePedal}
            brakeTempC={telemetry.brakeTempC * 0.8}
            wheelSpeedRpm={(telemetry.speedKmh / 3.6 / 0.35) * 9.55}
            exploded={effectiveExplode}
            wireframe={viewerSettings.wireframe}
            xRayMode={viewerSettings.xRayMode}
          />
        </group>
        <group position={[-0.05, 0, 0]}>
          {renderWheel(rrWheelRef)}
        </group>
      </group>
    </group>
  );
};
