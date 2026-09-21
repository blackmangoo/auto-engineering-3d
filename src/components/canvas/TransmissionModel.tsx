import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface TransmissionModelProps {
  gear?: number; // -1: R, 0: N, 1-6
  inputRpm?: number;
  exploded?: number; // 0 to 1
  wireframe?: boolean;
  xRayMode?: boolean;
  clutchEngagement?: number; // 0 to 1
}

interface GearPairDef {
  gearNumber: number;
  shaft: 'odd' | 'even';
  ratio: number;
  inRadius: number;
  outRadius: number;
  teethCount: number;
  xPos: number;
  color: number;
}

/**
 * Procedural Dual-Clutch Transmission (DCT) & Differential with:
 * - Dual concentric input shafts (Inner shaft for Odd gears 1, 3, 5; Outer hollow shaft for Even gears 2, 4, 6)
 * - Dual multi-plate clutches with hydraulic actuation plates
 * - Two parallel countershafts / output shafts with helical intermeshing gears
 * - Synchronizer sleeves with selector shift forks
 * - Torque flow glow line / energy shader highlighting active power path
 * - Final drive ring gear & open/LSD planetary differential with spider gears and dual axle half-shafts
 * - Cutaway transmission bell housing
 */
export function TransmissionModel({
  gear = 1,
  inputRpm = 2200,
  exploded = 0,
  wireframe = false,
  xRayMode = false,
  clutchEngagement = 1.0,
}: TransmissionModelProps) {
  // Shaft rotation refs
  const inputShaftOddRef = useRef<THREE.Group>(null);
  const inputShaftEvenRef = useRef<THREE.Group>(null);
  const outputShaft1Ref = useRef<THREE.Group>(null);
  const outputShaft2Ref = useRef<THREE.Group>(null);
  const diffRingRef = useRef<THREE.Group>(null);
  const leftAxleRef = useRef<THREE.Group>(null);
  const rightAxleRef = useRef<THREE.Group>(null);

  // Selector fork refs
  const fork1Ref = useRef<THREE.Group>(null);
  const fork2Ref = useRef<THREE.Group>(null);

  // Torque glow material ref
  const torqueGlowRef = useRef<THREE.MeshBasicMaterial>(null);

  // 6 Gear ratios and physical geometries
  const gearPairs: GearPairDef[] = useMemo(
    () => [
      { gearNumber: 1, shaft: 'odd', ratio: 3.82, inRadius: 0.22, outRadius: 0.84, teethCount: 28, xPos: -0.7, color: 0x38bdf8 },
      { gearNumber: 2, shaft: 'even', ratio: 2.36, inRadius: 0.32, outRadius: 0.74, teethCount: 26, xPos: -0.25, color: 0x818cf8 },
      { gearNumber: 3, shaft: 'odd', ratio: 1.62, inRadius: 0.42, outRadius: 0.68, teethCount: 24, xPos: 0.2, color: 0x34d399 },
      { gearNumber: 4, shaft: 'even', ratio: 1.21, inRadius: 0.50, outRadius: 0.60, teethCount: 22, xPos: 0.65, color: 0xfbbf24 },
      { gearNumber: 5, shaft: 'odd', ratio: 0.94, inRadius: 0.58, outRadius: 0.54, teethCount: 20, xPos: 1.1, color: 0xf472b6 },
      { gearNumber: 6, shaft: 'even', ratio: 0.78, inRadius: 0.66, outRadius: 0.48, teethCount: 18, xPos: 1.55, color: 0xa78bfa },
    ],
    []
  );

  // Active gear lookup
  const activeGearDef = useMemo(() => {
    return gearPairs.find((g) => g.gearNumber === gear) || null;
  }, [gear, gearPairs]);

  // Center distance between input shaft and output countershaft
  const shaftCenterDistance = 1.08;
  const diffCenterDistance = 1.25;

  // Materials
  const materials = useMemo(() => {
    return {
      housing: new THREE.MeshStandardMaterial({
        color: 0x1e2229,
        metalness: 0.8,
        roughness: 0.4,
        wireframe,
        transparent: true,
        opacity: xRayMode ? 0.25 : 0.65,
        side: THREE.DoubleSide,
      }),
      shaftSteel: new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.95,
        roughness: 0.15,
        wireframe,
      }),
      gearChrome: new THREE.MeshStandardMaterial({
        color: 0xcfd8dc,
        metalness: 0.92,
        roughness: 0.22,
        wireframe,
      }),
      clutchPackA: new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Blue for Odd clutch
        metalness: 0.85,
        roughness: 0.3,
        wireframe,
      }),
      clutchPackB: new THREE.MeshStandardMaterial({
        color: 0x7c3aed, // Purple for Even clutch
        metalness: 0.85,
        roughness: 0.3,
        wireframe,
      }),
      synchroBrass: new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.85,
        roughness: 0.25,
        wireframe,
      }),
      shiftFork: new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.7,
        roughness: 0.4,
      }),
      diffCase: new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.9,
        roughness: 0.25,
        wireframe,
      }),
      torqueGlow: new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: false,
        transparent: true,
        opacity: 0.85,
      }),
    };
  }, [wireframe, xRayMode]);

  // Helper geometry creation: gear teeth cylinder
  const createGearMesh = (radius: number, thickness: number, teeth: number, isEngaged: boolean) => {
    return (
      <group>
        {/* Core gear body with weight reduction cutouts */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.gearChrome}>
          <cylinderGeometry args={[radius * 0.92, radius * 0.92, thickness, 32]} />
        </mesh>
        {/* Gear rim with teeth */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius, radius, thickness * 0.9, teeth]} />
          <meshStandardMaterial
            color={isEngaged ? 0x67e8f9 : 0x94a3b8}
            metalness={0.9}
            roughness={0.2}
            wireframe={wireframe}
            emissive={isEngaged ? new THREE.Color(0x0284c7) : new THREE.Color(0x000000)}
            emissiveIntensity={isEngaged ? 0.6 : 0}
          />
        </mesh>
      </group>
    );
  };

  // Animation frame
  useFrame((_, delta) => {
    const activeIsOdd = gear % 2 === 1 && gear > 0;
    const activeIsEven = gear % 2 === 0 && gear > 0;

    // Dual clutch engagement factors
    // When in 1st gear, Clutch A is engaged (Odd), Clutch B pre-selects 2nd gear
    const clutchASpeed = activeIsOdd ? clutchEngagement : 0.05;
    const clutchBSpeed = activeIsEven ? clutchEngagement : 0.05;

    const inputRadPerSec = (inputRpm * 2 * Math.PI) / 60;
    const baseRotDelta = inputRadPerSec * delta;

    // Rotate Odd input shaft
    if (inputShaftOddRef.current) {
      inputShaftOddRef.current.rotation.x += baseRotDelta * clutchASpeed;
    }

    // Rotate Even input shaft
    if (inputShaftEvenRef.current) {
      inputShaftEvenRef.current.rotation.x += baseRotDelta * clutchBSpeed;
    }

    // Calculate output ratio
    let currentRatio = 1.0;
    if (activeGearDef) {
      currentRatio = activeGearDef.ratio;
    } else if (gear === -1) {
      currentRatio = -3.5;
    }

    const outputRotDelta = -(baseRotDelta * (activeIsOdd ? clutchASpeed : clutchBSpeed)) / (currentRatio || 1.0);

    // Countershaft 1 & 2 rotation
    if (outputShaft1Ref.current) {
      outputShaft1Ref.current.rotation.x += outputRotDelta;
    }
    if (outputShaft2Ref.current) {
      outputShaft2Ref.current.rotation.x += outputRotDelta;
    }

    // Differential Ring Gear & Axle Rotation (Final drive reduction approx 3.73:1)
    const finalDriveRatio = 3.73;
    const diffRotDelta = -outputRotDelta / finalDriveRatio;

    if (diffRingRef.current) {
      diffRingRef.current.rotation.x += diffRotDelta;
    }
    if (leftAxleRef.current) {
      leftAxleRef.current.rotation.x += diffRotDelta;
    }
    if (rightAxleRef.current) {
      rightAxleRef.current.rotation.x += diffRotDelta;
    }

    // Dynamic selector fork shifts
    if (fork1Ref.current) {
      // Moves along X axis toward gear 1 or 3
      const targetX = gear === 1 ? -0.5 : gear === 3 ? 0.35 : 0;
      fork1Ref.current.position.x = THREE.MathUtils.lerp(fork1Ref.current.position.x, targetX, delta * 12);
    }
    if (fork2Ref.current) {
      // Moves toward gear 2 or 4
      const targetX = gear === 2 ? -0.1 : gear === 4 ? 0.75 : 0;
      fork2Ref.current.position.x = THREE.MathUtils.lerp(fork2Ref.current.position.x, targetX, delta * 12);
    }

    // Pulse torque flow glow
    if (torqueGlowRef.current) {
      torqueGlowRef.current.opacity = 0.5 + 0.3 * Math.sin(Date.now() * 0.008);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Cutaway Transmission Bell Housing */}
      <group position={[0.5, 0, 0]}>
        <mesh material={materials.housing} position={[0, 0, 0]}>
          <boxGeometry args={[3.6, 2.4, 1.9]} />
        </mesh>
        {/* Bell Housing Flange at engine mating face */}
        <mesh position={[-1.78, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.housing}>
          <cylinderGeometry args={[1.15, 1.15, 0.12, 32]} />
        </mesh>
      </group>

      {/* 2. Concentric Dual Clutches (Clutch Pack 1 for Odd, Clutch Pack 2 for Even) */}
      <group position={[-1.35 - exploded * 0.5, 0, 0]}>
        {/* Outer Clutch Drum */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.clutchPackA}>
          <cylinderGeometry args={[0.92, 0.92, 0.35, 32, 1, true]} />
        </mesh>

        {/* Dual Clutch Disc Plates */}
        <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.clutchPackA}>
          <cylinderGeometry args={[0.88, 0.88, 0.05, 32]} />
        </mesh>
        <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.clutchPackB}>
          <cylinderGeometry args={[0.74, 0.74, 0.05, 32]} />
        </mesh>

        {/* Central hydraulic actuation cylinder sleeve */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.synchroBrass}>
          <cylinderGeometry args={[0.3, 0.3, 0.42, 24]} />
        </mesh>
      </group>

      {/* 3. Dual Concentric Input Shafts */}
      {/* Odd Shaft (Solid Inner Core) */}
      <group ref={inputShaftOddRef} position={[0, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.shaftSteel}>
          <cylinderGeometry args={[0.1, 0.1, 3.2, 24]} />
        </mesh>
        {/* Odd Gears on Input Shaft (Gears 1, 3, 5) */}
        {gearPairs
          .filter((g) => g.shaft === 'odd')
          .map((g) => (
            <group key={`input-gear-${g.gearNumber}`} position={[g.xPos, 0, 0]}>
              {createGearMesh(g.inRadius, 0.22, g.teethCount, gear === g.gearNumber)}
            </group>
          ))}
      </group>

      {/* Even Shaft (Hollow Outer Sleeve around front portion) */}
      <group ref={inputShaftEvenRef} position={[0, 0, 0]}>
        <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.shaftSteel}>
          <cylinderGeometry args={[0.16, 0.16, 1.8, 24, 1, true]} />
        </mesh>
        {/* Even Gears on Input Shaft (Gears 2, 4, 6) */}
        {gearPairs
          .filter((g) => g.shaft === 'even')
          .map((g) => (
            <group key={`input-gear-${g.gearNumber}`} position={[g.xPos, 0, 0]}>
              {createGearMesh(g.inRadius, 0.22, g.teethCount, gear === g.gearNumber)}
            </group>
          ))}
      </group>

      {/* 4. Countershaft 1 & Output Gears (Meshing with Input Gears) */}
      <group ref={outputShaft1Ref} position={[0, shaftCenterDistance, 0]}>
        {/* Solid countershaft */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.shaftSteel}>
          <cylinderGeometry args={[0.13, 0.13, 3.1, 24]} />
        </mesh>

        {/* Output Gears intermeshing with Input gears */}
        {gearPairs.map((g) => (
          <group key={`output-gear-${g.gearNumber}`} position={[g.xPos, 0, 0]}>
            {createGearMesh(g.outRadius, 0.22, Math.round(g.teethCount * g.ratio), gear === g.gearNumber)}
          </group>
        ))}

        {/* Final Drive Pinion on Countershaft 1 */}
        <mesh position={[2.0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.synchroBrass}>
          <cylinderGeometry args={[0.3, 0.3, 0.28, 20]} />
        </mesh>
      </group>

      {/* 5. Synchronizer Sleeves & Selector Forks */}
      {/* Synchro 1-2 */}
      <group ref={fork1Ref} position={[-0.48, shaftCenterDistance, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.synchroBrass}>
          <cylinderGeometry args={[0.42, 0.42, 0.18, 24]} />
        </mesh>
        {/* Actuator Shift Fork */}
        <mesh position={[0, 0.35 + exploded * 0.4, 0]} material={materials.shiftFork}>
          <boxGeometry args={[0.12, 0.6, 0.5]} />
        </mesh>
      </group>

      {/* Synchro 3-4 */}
      <group ref={fork2Ref} position={[0.42, shaftCenterDistance, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.synchroBrass}>
          <cylinderGeometry args={[0.42, 0.42, 0.18, 24]} />
        </mesh>
        {/* Actuator Shift Fork */}
        <mesh position={[0, 0.35 + exploded * 0.4, 0]} material={materials.shiftFork}>
          <boxGeometry args={[0.12, 0.6, 0.5]} />
        </mesh>
      </group>

      {/* 6. Torque Flow Path Visual Glow */}
      {activeGearDef && (
        <group position={[0, 0, 0]}>
          {/* Path from clutch through active input gear to output countershaft */}
          <mesh
            position={[activeGearDef.xPos, shaftCenterDistance / 2, 0]}
            rotation={[0, 0, 0]}
          >
            <boxGeometry args={[0.16, shaftCenterDistance, 0.16]} />
            <meshBasicMaterial
              ref={torqueGlowRef}
              color={activeGearDef.color}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}

      {/* 7. Differential & Final Drive Ring Gear */}
      <group position={[2.0, -diffCenterDistance * 0.4, 0]}>
        {/* Final Drive Large Crown Ring Gear */}
        <group ref={diffRingRef}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.diffCase}>
            <cylinderGeometry args={[0.88, 0.88, 0.28, 36]} />
          </mesh>
          {/* Crown Gear Bevel Teeth */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.gearChrome}>
            <cylinderGeometry args={[0.92, 0.92, 0.18, 44]} />
          </mesh>

          {/* Differential Cage / Carrier Housing */}
          <mesh position={[0, 0, 0]} material={materials.diffCase}>
            <sphereGeometry args={[0.55, 16, 16]} />
          </mesh>

          {/* Internal Spider / Pinion Differential Gears */}
          <mesh position={[0, 0.22, 0]} material={materials.synchroBrass}>
            <coneGeometry args={[0.2, 0.22, 16]} />
          </mesh>
          <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]} material={materials.synchroBrass}>
            <coneGeometry args={[0.2, 0.22, 16]} />
          </mesh>
        </group>

        {/* Dual Axle Half-Shafts (Left & Right Outgoing Drive) */}
        {/* Left Drive Axle extending Z- */}
        <group ref={leftAxleRef} position={[0, 0, -0.8 - exploded * 0.4]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.shaftSteel}>
            <cylinderGeometry args={[0.12, 0.12, 1.2, 20]} />
          </mesh>
          {/* CV Joint boot */}
          <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]} material={materials.housing}>
            <cylinderGeometry args={[0.22, 0.16, 0.35, 16]} />
          </mesh>
        </group>

        {/* Right Drive Axle extending Z+ */}
        <group ref={rightAxleRef} position={[0, 0, 0.8 + exploded * 0.4]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.shaftSteel}>
            <cylinderGeometry args={[0.12, 0.12, 1.2, 20]} />
          </mesh>
          {/* CV Joint boot */}
          <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]} material={materials.housing}>
            <cylinderGeometry args={[0.22, 0.16, 0.35, 16]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
