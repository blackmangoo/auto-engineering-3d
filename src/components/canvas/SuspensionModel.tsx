import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface SuspensionModelProps {
  travelMm?: number; // e.g. -40 to +40 mm
  roadRoughness?: number; // 0 to 1
  steeringAngleDeg?: number; // -30 to +30 deg
  exploded?: number; // 0 to 1
  wireframe?: boolean;
  xRayMode?: boolean;
}

/**
 * Procedural Double Wishbone Suspension System with:
 * - Upper A-Arm (Control arm) & Lower A-Arm (Control arm) pivoting on subframe mounts
 * - Dynamic procedural compressing & expanding helical coilover spring
 * - Hydraulic monotube damper with internal piston shaft sliding into damper body
 * - Steering tie rod & rack linkage steering the upright
 * - Upright (Steering Knuckle) with ball joints
 * - Wheel Hub with 5-lug bolt pattern and brake disc mounting face
 * - Anti-roll sway bar link connected to lower arm
 * - Road bump oscillation simulation driving realistic suspension travel kinematics
 */
export function SuspensionModel({
  travelMm = 0,
  roadRoughness = 0.3,
  steeringAngleDeg = 0,
  exploded = 0,
  wireframe = false,
  xRayMode = false,
}: SuspensionModelProps) {
  // Suspension kinematic group refs
  const wheelAssemblyRef = useRef<THREE.Group>(null);
  const upperArmRef = useRef<THREE.Group>(null);
  const lowerArmRef = useRef<THREE.Group>(null);
  const damperShaftRef = useRef<THREE.Group>(null);
  const coilSpringRef = useRef<THREE.Mesh>(null);
  const tieRodRef = useRef<THREE.Group>(null);
  const swayLinkRef = useRef<THREE.Group>(null);

  // Wheel rotation for simulated forward motion
  const wheelHubRef = useRef<THREE.Group>(null);

  // Geometry dimensions (in 3D units, where 1 unit ~ 200mm)
  const armLength = 1.35; // Lower wishbone length from chassis mount to upright ball joint
  const upperArmLength = 1.15;
  const chassisMountZ = 0.8; // Separation between front and rear pivot bushings

  // Shared materials
  const materials = useMemo(() => {
    const opacity = xRayMode ? 0.35 : 1.0;
    const transparent = xRayMode;

    return {
      subframe: new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.4,
        wireframe,
        transparent,
        opacity,
      }),
      upperWishbone: new THREE.MeshStandardMaterial({
        color: 0x3b82f6, // Blue anodized upper arm
        metalness: 0.85,
        roughness: 0.25,
        wireframe,
      }),
      lowerWishbone: new THREE.MeshStandardMaterial({
        color: 0x1d4ed8, // Darker blue lower arm
        metalness: 0.88,
        roughness: 0.25,
        wireframe,
      }),
      springSteel: new THREE.MeshStandardMaterial({
        color: 0xef4444, // Red performance coilover spring
        metalness: 0.75,
        roughness: 0.2,
        wireframe,
      }),
      damperBody: new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // Gold/Bronze Ohlins style damper body
        metalness: 0.92,
        roughness: 0.18,
        wireframe,
      }),
      damperShaft: new THREE.MeshStandardMaterial({
        color: 0xf1f5f9, // Mirror polished chrome shaft
        metalness: 0.98,
        roughness: 0.05,
      }),
      knuckleAlloy: new THREE.MeshStandardMaterial({
        color: 0x64748b, // Forged aluminum alloy upright
        metalness: 0.85,
        roughness: 0.3,
        wireframe,
      }),
      hubSteel: new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        metalness: 0.9,
        roughness: 0.2,
      }),
      ballJoints: new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.7,
        roughness: 0.5,
      }),
      bushingRubber: new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.9,
      }),
    };
  }, [wireframe, xRayMode]);

  // Procedural spring geometry builder: creates a 3D helical curve
  const springBaseCurve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const coils = 8;
    const pointsCount = 180;
    const radius = 0.22;
    const naturalHeight = 1.6;

    for (let i = 0; i <= pointsCount; i++) {
      const t = i / pointsCount;
      const angle = t * coils * 2 * Math.PI;
      const x = Math.cos(angle) * radius;
      const y = t * naturalHeight;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }
    const path = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(path, 140, 0.038, 12, false);
  }, []);

  // Frame animation loop
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    // Road bump oscillation simulation + static travel parameter
    // Multi-frequency harmonic road roughness profile
    const bumpWave1 = Math.sin(time * 9.0) * 0.12;
    const bumpWave2 = Math.cos(time * 18.0) * 0.05;
    const bumpWave3 = Math.sin(time * 3.5) * 0.18;
    const dynamicTravelMm = travelMm + (bumpWave1 + bumpWave2 + bumpWave3) * roadRoughness * 40;

    // Convert mm travel to world units (1 world unit ~ 200 mm)
    const travelUnits = dynamicTravelMm / 200;

    // Wishbone deflection angle (theta = asin(travel / length))
    const lowerArmAngle = Math.asin(THREE.MathUtils.clamp(travelUnits / armLength, -0.6, 0.6));
    const upperArmAngle = Math.asin(THREE.MathUtils.clamp(travelUnits / upperArmLength, -0.6, 0.6));

    // Wheel hub vertical motion
    const hubY = travelUnits;
    if (wheelAssemblyRef.current) {
      wheelAssemblyRef.current.position.y = hubY;
      // Camber change under bump travel (dynamic camber curve)
      const camberAngle = lowerArmAngle * 0.35;
      const steerRad = THREE.MathUtils.degToRad(steeringAngleDeg);
      wheelAssemblyRef.current.rotation.z = -camberAngle;
      wheelAssemblyRef.current.rotation.y = steerRad;
    }

    // Lower A-arm pivoting
    if (lowerArmRef.current) {
      lowerArmRef.current.rotation.z = lowerArmAngle;
    }

    // Upper A-arm pivoting
    if (upperArmRef.current) {
      upperArmRef.current.rotation.z = upperArmAngle;
    }

    // Damper compression:
    // When suspension compresses (hub moves up), damper shaft slides deeper into body
    // and spring scales vertically along its length
    const compressionFactor = THREE.MathUtils.clamp(1 - travelUnits * 0.45, 0.55, 1.45);
    if (damperShaftRef.current) {
      damperShaftRef.current.position.y = 0.45 - travelUnits * 0.65;
    }

    if (coilSpringRef.current) {
      coilSpringRef.current.scale.set(1, compressionFactor, 1);
    }

    // Steering tie rod follows upright steering arm
    if (tieRodRef.current) {
      tieRodRef.current.position.y = hubY * 0.7;
    }

    // Sway bar link moves with lower wishbone
    if (swayLinkRef.current) {
      swayLinkRef.current.position.y = hubY * 0.5;
    }

    // Continuous simulated wheel hub rotation
    if (wheelHubRef.current) {
      wheelHubRef.current.rotation.x += delta * 12.0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Subframe & Chassis Hardpoints (Inboard Mounting Base at X = 0) */}
      <group position={[-1.3 - exploded * 0.6, 0, 0]}>
        {/* Longitudinal Subframe Rails */}
        <mesh position={[0, 0, 0]} material={materials.subframe}>
          <boxGeometry args={[0.35, 1.8, 2.2]} />
        </mesh>
        {/* Chassis Pick-up Bracket Cleats for Upper Wishbone */}
        <mesh position={[0.2, 0.7, -chassisMountZ / 2]} material={materials.bushingRubber}>
          <cylinderGeometry args={[0.08, 0.08, 0.18, 16]} />
        </mesh>
        <mesh position={[0.2, 0.7, chassisMountZ / 2]} material={materials.bushingRubber}>
          <cylinderGeometry args={[0.08, 0.08, 0.18, 16]} />
        </mesh>
        {/* Chassis Pick-up Bracket Cleats for Lower Wishbone */}
        <mesh position={[0.2, -0.65, -chassisMountZ / 2]} material={materials.bushingRubber}>
          <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
        </mesh>
        <mesh position={[0.2, -0.65, chassisMountZ / 2]} material={materials.bushingRubber}>
          <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
        </mesh>
        {/* Upper Damper Top Hat Mount / Shock Tower */}
        <mesh position={[0.55, 1.45, 0]} material={materials.subframe}>
          <cylinderGeometry args={[0.25, 0.32, 0.3, 24]} />
        </mesh>
      </group>

      {/* 2. Lower Wishbone A-Arm (Wide triangulated tubular control arm) */}
      <group
        ref={lowerArmRef}
        position={[-1.1 - exploded * 0.3, -0.65, 0]}
      >
        {/* Forward arm tube */}
        <mesh
          position={[armLength / 2, 0, -chassisMountZ / 4]}
          rotation={[0, 0.28, 0]}
          material={materials.lowerWishbone}
        >
          <boxGeometry args={[armLength, 0.08, 0.08]} />
        </mesh>
        {/* Rearward arm tube */}
        <mesh
          position={[armLength / 2, 0, chassisMountZ / 4]}
          rotation={[0, -0.28, 0]}
          material={materials.lowerWishbone}
        >
          <boxGeometry args={[armLength, 0.08, 0.08]} />
        </mesh>
        {/* Cross brace webbing */}
        <mesh position={[armLength * 0.45, 0, 0]} material={materials.lowerWishbone}>
          <boxGeometry args={[0.1, 0.06, chassisMountZ * 0.5]} />
        </mesh>
        {/* Outboard Lower Ball Joint */}
        <mesh position={[armLength, 0, 0]} material={materials.ballJoints}>
          <sphereGeometry args={[0.12, 16, 16]} />
        </mesh>
        {/* Shock mount clevis tab on lower arm */}
        <mesh position={[armLength * 0.55, 0.12, 0]} material={materials.lowerWishbone}>
          <boxGeometry args={[0.14, 0.18, 0.14]} />
        </mesh>
      </group>

      {/* 3. Upper Wishbone A-Arm (Compact forged upper control arm) */}
      <group
        ref={upperArmRef}
        position={[-1.1 - exploded * 0.3, 0.7, 0]}
      >
        {/* Forward leg */}
        <mesh
          position={[upperArmLength / 2, 0, -chassisMountZ / 4]}
          rotation={[0, 0.3, Math.PI / 2]}
          material={materials.upperWishbone}
        >
          <cylinderGeometry args={[0.04, 0.04, upperArmLength, 16]} />
        </mesh>
        {/* Rearward leg */}
        <mesh
          position={[upperArmLength / 2, 0, chassisMountZ / 4]}
          rotation={[0, -0.3, Math.PI / 2]}
          material={materials.upperWishbone}
        >
          <cylinderGeometry args={[0.04, 0.04, upperArmLength, 16]} />
        </mesh>
        {/* Outboard Upper Ball Joint */}
        <mesh position={[upperArmLength, 0, 0]} material={materials.ballJoints}>
          <sphereGeometry args={[0.1, 16, 16]} />
        </mesh>
      </group>

      {/* 4. Coilover Shock Absorber & Compressing Spring */}
      <group position={[-0.45, -0.5, 0]} rotation={[0, 0, 0.22]}>
        {/* Lower Damper Body Cylinder (Attached to lower wishbone) */}
        <mesh position={[0, 0.45, 0]} material={materials.damperBody}>
          <cylinderGeometry args={[0.12, 0.12, 0.9, 24]} />
        </mesh>

        {/* Lower Spring Perch Collar (Threaded ride height adjuster) */}
        <mesh position={[0, 0.55, 0]} material={materials.upperWishbone}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
        </mesh>

        {/* Upper Damper Shaft & Top Mount (Telescopes vertically) */}
        <group ref={damperShaftRef} position={[0, 0.45, 0]}>
          {/* Polished Hard Chrome Piston Rod */}
          <mesh position={[0, 0.65, 0]} material={materials.damperShaft}>
            <cylinderGeometry args={[0.045, 0.045, 1.2, 20]} />
          </mesh>
          {/* Upper Spring Seat & Top Mount Bushing */}
          <mesh position={[0, 1.25, 0]} material={materials.subframe}>
            <cylinderGeometry args={[0.25, 0.25, 0.1, 24]} />
          </mesh>
        </group>

        {/* Dynamic Compressing Coil Spring */}
        <mesh
          ref={coilSpringRef}
          geometry={springBaseCurve}
          material={materials.springSteel}
          position={[0, 0.55, 0]}
        />
      </group>

      {/* 5. Outboard Upright / Steering Knuckle & Wheel Hub Assembly */}
      <group
        ref={wheelAssemblyRef}
        position={[0.3 + exploded * 0.4, 0, 0]}
      >
        {/* Upright / Steering Knuckle Carrier */}
        <group position={[0, 0, 0]}>
          {/* Main vertical upright upright beam */}
          <mesh position={[0, 0.05, 0]} material={materials.knuckleAlloy}>
            <boxGeometry args={[0.18, 1.45, 0.22]} />
          </mesh>
          {/* Upper ball joint receiver boss */}
          <mesh position={[0, 0.72, 0]} material={materials.knuckleAlloy}>
            <cylinderGeometry args={[0.12, 0.12, 0.16, 16]} />
          </mesh>
          {/* Lower ball joint receiver boss */}
          <mesh position={[0, -0.65, 0]} material={materials.knuckleAlloy}>
            <cylinderGeometry args={[0.14, 0.14, 0.18, 16]} />
          </mesh>
          {/* Steering arm extending forward (Z-) for tie rod connection */}
          <mesh position={[-0.1, -0.15, -0.32]} rotation={[0, -0.3, 0]} material={materials.knuckleAlloy}>
            <boxGeometry args={[0.24, 0.08, 0.35]} />
          </mesh>
          {/* Brake caliper mounting lugs */}
          <mesh position={[0.12, 0.35, 0.2]} material={materials.knuckleAlloy}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
          </mesh>
          <mesh position={[0.12, -0.25, 0.2]} material={materials.knuckleAlloy}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
          </mesh>
        </group>

        {/* Rotating Wheel Hub with 5-Lug Bolt Pattern */}
        <group ref={wheelHubRef} position={[0.22 + exploded * 0.3, -0.05, 0]}>
          {/* Central Hub Spindle Bearing Flange */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.hubSteel}>
            <cylinderGeometry args={[0.42, 0.42, 0.14, 32]} />
          </mesh>
          {/* Center Hub Bore / Axle Nut */}
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.damperBody}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 6]} />
          </mesh>
          {/* 5 Wheel Lug Studs */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * 2 * Math.PI) / 5;
            const studRadius = 0.28;
            const sy = Math.cos(angle) * studRadius;
            const sz = Math.sin(angle) * studRadius;

            return (
              <mesh
                key={`stud-${i}`}
                position={[0.12, sy, sz]}
                rotation={[0, 0, Math.PI / 2]}
                material={materials.hubSteel}
              >
                <cylinderGeometry args={[0.035, 0.035, 0.14, 12]} />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* 6. Steering Rack & Tie Rod Linkage */}
      <group ref={tieRodRef} position={[-0.4 - exploded * 0.2, -0.15, -0.65]}>
        {/* Inner Tie Rod Ball Joint */}
        <mesh position={[-0.4, 0, 0]} material={materials.ballJoints}>
          <sphereGeometry args={[0.07, 12, 12]} />
        </mesh>
        {/* Tie rod adjusting sleeve */}
        <mesh position={[0.1, 0, 0.15]} rotation={[Math.PI / 2, -0.32, 0]} material={materials.hubSteel}>
          <cylinderGeometry args={[0.035, 0.035, 0.9, 16]} />
        </mesh>
        {/* Outer Tie Rod End Heim Joint */}
        <mesh position={[0.6, 0, 0.32]} material={materials.ballJoints}>
          <sphereGeometry args={[0.08, 12, 12]} />
        </mesh>
      </group>

      {/* 7. Anti-Roll Sway Bar Link */}
      <group ref={swayLinkRef} position={[-0.3, -0.4, 0.45]}>
        {/* Vertical drop link rod */}
        <mesh material={materials.hubSteel}>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 12]} />
        </mesh>
        {/* Lower ball link */}
        <mesh position={[0, -0.22, 0]} material={materials.ballJoints}>
          <sphereGeometry args={[0.06, 12, 12]} />
        </mesh>
        {/* Sway bar torsion arm end */}
        <mesh position={[-0.2, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.subframe}>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 16]} />
        </mesh>
      </group>
    </group>
  );
}
