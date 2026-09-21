import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface BrakeModelProps {
  pedalPressure?: number; // 0 to 1
  brakeTempC?: number; // Ambient ~25C up to 900C glowing
  wheelSpeedRpm?: number;
  exploded?: number; // 0 to 1
  wireframe?: boolean;
  xRayMode?: boolean;
}

/**
 * Procedural High-Performance Brake Assembly with:
 * - Ventilated cross-drilled carbon-ceramic brake disc rotor:
 *   - Directional curved cooling vanes between dual friction faces
 *   - Radial cross-drilled chamfered cooling holes
 *   - Lightweight floating aluminum hat/bell with bobbins/drive pins
 * - Monobloc 6-piston opposed brake caliper:
 *   - Staggered piston diameters (e.g. 30mm, 34mm, 38mm)
 *   - Hydraulic crossover fluid bridges and bleeder valves
 * - Dual clamping brake pads with backing plates, friction pucks, and anti-rattle clips
 * - Dynamic thermal radiation shader:
 *   - Simulates blackbody radiation heating from dark charcoal -> cherry red -> incandescent orange-yellow
 *   - Dissipates heat dynamically and spikes under clamping pad friction
 */
export function BrakeModel({
  pedalPressure = 0,
  brakeTempC = 350,
  wheelSpeedRpm = 950,
  exploded = 0,
  wireframe = false,
  xRayMode = false,
}: BrakeModelProps) {
  // Rotational rotor group
  const rotorRef = useRef<THREE.Group>(null);

  // Clamping pad refs (move inward on X axis as pedal is pressed)
  const innerPadRef = useRef<THREE.Group>(null);
  const outerPadRef = useRef<THREE.Group>(null);

  // Hydraulic pistons inside caliper (move toward disc under hydraulic pressure)
  const innerPistonsRef = useRef<THREE.Group>(null);
  const outerPistonsRef = useRef<THREE.Group>(null);

  // Thermal glow material ref
  const frictionRingMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Disc geometry dimensions
  const outerRadius = 1.65; // ~380mm rotor in scale
  const innerRadius = 0.95;
  const discThickness = 0.28;
  const faceThickness = 0.07;
  const vaneCount = 28;

  // Precompute cross-drilled holes patterns (polar coordinates)
  const drillHoles = useMemo(() => {
    const holes: { r: number; theta: number }[] = [];
    const spirals = 9;
    const holesPerSpiral = 4;

    for (let s = 0; s < spirals; s++) {
      const baseTheta = (s * 2 * Math.PI) / spirals;
      for (let h = 0; h < holesPerSpiral; h++) {
        const r = innerRadius + 0.15 + (h / (holesPerSpiral - 1)) * (outerRadius - innerRadius - 0.3);
        const theta = baseTheta + (h * 0.14);
        holes.push({ r, theta });
      }
    }
    return holes;
  }, [innerRadius, outerRadius]);

  // Precompute internal curved directional cooling vanes
  const coolingVanes = useMemo(() => {
    return Array.from({ length: vaneCount }, (_, i) => {
      const angle = (i * 2 * Math.PI) / vaneCount;
      return angle;
    });
  }, [vaneCount]);

  // Materials
  const materials = useMemo(() => {
    const opacity = xRayMode ? 0.35 : 1.0;
    const transparent = xRayMode;

    return {
      caliperBody: new THREE.MeshStandardMaterial({
        color: 0xdc2626, // Brembo high-gloss red
        metalness: 0.85,
        roughness: 0.25,
        wireframe,
        transparent,
        opacity,
      }),
      rotorHat: new THREE.MeshStandardMaterial({
        color: 0x1e293b, // Hard-anodized billet aluminum hat
        metalness: 0.92,
        roughness: 0.2,
        wireframe,
      }),
      driveBobbins: new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // Gold titanium float bobbins
        metalness: 0.95,
        roughness: 0.15,
      }),
      padBackingPlate: new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.4,
      }),
      padFrictionCompound: new THREE.MeshStandardMaterial({
        color: 0x1c1917, // Sintered carbon-metallic compound
        roughness: 0.85,
        metalness: 0.2,
      }),
      pistonTitanium: new THREE.MeshStandardMaterial({
        color: 0x94a3b8, // Titanium ventilated pistons
        metalness: 0.95,
        roughness: 0.15,
      }),
      crossoverPipe: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2,
      }),
    };
  }, [wireframe, xRayMode]);

  // Frame update
  useFrame((_, delta) => {
    // 1. Rotate brake rotor with wheel speed
    const radPerSec = (wheelSpeedRpm * 2 * Math.PI) / 60;
    if (rotorRef.current) {
      rotorRef.current.rotation.x += radPerSec * delta;
    }

    // 2. Pad clamping under hydraulic pedal pressure
    // Baseline clearance ~ 0.05 units, fully clamped presses right onto disc surface
    const clampOffset = (1 - pedalPressure) * 0.06;
    if (innerPadRef.current) {
      innerPadRef.current.position.x = -discThickness / 2 - 0.035 - clampOffset - exploded * 0.4;
    }
    if (outerPadRef.current) {
      outerPadRef.current.position.x = discThickness / 2 + 0.035 + clampOffset + exploded * 0.4;
    }

    // Pistons push pads
    if (innerPistonsRef.current) {
      innerPistonsRef.current.position.x = -discThickness / 2 - 0.08 - clampOffset * 1.2 - exploded * 0.6;
    }
    if (outerPistonsRef.current) {
      outerPistonsRef.current.position.x = discThickness / 2 + 0.08 + clampOffset * 1.2 + exploded * 0.6;
    }

    // 3. Dynamic Thermal Blackbody Radiative Glow Shader/Material
    // Carbon-ceramic glow starts becoming visible around 450C, turning incandescent orange by 800C+
    if (frictionRingMaterialRef.current) {
      const dynamicTemp = brakeTempC + pedalPressure * 250;
      const normalizedTemp = THREE.MathUtils.clamp((dynamicTemp - 200) / 750, 0, 1);

      if (normalizedTemp > 0.05) {
        frictionRingMaterialRef.current.emissiveIntensity = normalizedTemp * 2.8;

        // Color gradient: dark orange (200C) -> bright red (500C) -> incandescent golden yellow (850C+)
        const r = THREE.MathUtils.lerp(0.5, 1.0, normalizedTemp);
        const g = THREE.MathUtils.lerp(0.05, 0.65, Math.pow(normalizedTemp, 2.2));
        const b = THREE.MathUtils.lerp(0.01, 0.15, Math.pow(normalizedTemp, 3.5));
        frictionRingMaterialRef.current.emissive.setRGB(r, g, b);
      } else {
        frictionRingMaterialRef.current.emissiveIntensity = 0;
        frictionRingMaterialRef.current.emissive.setRGB(0, 0, 0);
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Rotating Brake Disc Rotor Assembly */}
      <group ref={rotorRef} position={[0, 0, 0]}>
        {/* Central Floating Lightweight Aluminum Hat / Bell */}
        <group position={[0, 0, 0]}>
          {/* Hat cylindrical mounting bowl */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.rotorHat}>
            <cylinderGeometry args={[innerRadius * 0.88, innerRadius * 0.88, 0.32, 32]} />
          </mesh>
          {/* Hub mounting flange */}
          <mesh position={[0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.rotorHat}>
            <cylinderGeometry args={[innerRadius * 0.94, innerRadius * 0.94, 0.06, 32]} />
          </mesh>
          {/* 5 Wheel stud clearance holes & center bore */}
          <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 0.07, 24]} />
            <meshBasicMaterial color={0x0b0f17} />
          </mesh>

          {/* 10 Floating Drive Bobbins / Radial expansion bushings connecting hat to carbon rotor */}
          {Array.from({ length: 10 }).map((_, idx) => {
            const angle = (idx * 2 * Math.PI) / 10;
            const bx = Math.cos(angle) * (innerRadius * 0.92);
            const by = Math.sin(angle) * (innerRadius * 0.92);

            return (
              <group key={`bobbin-${idx}`} position={[0, bx, by]}>
                <mesh rotation={[0, 0, Math.PI / 2]} material={materials.driveBobbins}>
                  <cylinderGeometry args={[0.045, 0.045, 0.34, 16]} />
                </mesh>
                {/* Bobbin lock fastener washer */}
                <mesh position={[0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.driveBobbins}>
                  <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* Outer Carbon-Ceramic Friction Ring with Thermal Glow */}
        <group position={[0, 0, 0]}>
          {/* Outer Friction Face (X+) */}
          <mesh position={[discThickness / 2 - faceThickness / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[outerRadius, outerRadius, faceThickness, 48, 1, false]}
            />
            <meshStandardMaterial
              ref={frictionRingMaterialRef}
              color={0x2b2d31} // Dark woven carbon matrix look
              metalness={0.7}
              roughness={0.35}
              wireframe={wireframe}
              emissive={new THREE.Color(0xff4400)}
              emissiveIntensity={0}
            />
          </mesh>

          {/* Inner Friction Face (X-) */}
          <mesh position={[-discThickness / 2 + faceThickness / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[outerRadius, outerRadius, faceThickness, 48, 1, false]}
            />
            <meshStandardMaterial
              color={0x2b2d31}
              metalness={0.7}
              roughness={0.35}
              wireframe={wireframe}
            />
          </mesh>

          {/* Internal Directional Curved Cooling Vanes between faces */}
          {coolingVanes.map((angle, idx) => {
            const midR = (outerRadius + innerRadius) / 2;
            const vx = Math.cos(angle) * midR;
            const vy = Math.sin(angle) * midR;
            return (
              <mesh
                key={`vane-${idx}`}
                position={[0, vx, vy]}
                rotation={[0, 0, angle + 0.35]}
              >
                <boxGeometry args={[discThickness - faceThickness * 2, 0.45, 0.03]} />
                <meshStandardMaterial color={0x18181b} metalness={0.8} roughness={0.4} />
              </mesh>
            );
          })}

          {/* Cross-Drilled Chamfered Cooling Holes */}
          {drillHoles.map((hole, idx) => {
            const hx = Math.cos(hole.theta) * hole.r;
            const hy = Math.sin(hole.theta) * hole.r;
            return (
              <group key={`hole-${idx}`} position={[0, hx, hy]}>
                {/* Cutout visual indent */}
                <mesh position={[discThickness / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.032, 0.032, 0.015, 10]} />
                  <meshBasicMaterial color={0x09090b} />
                </mesh>
                <mesh position={[-discThickness / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.032, 0.032, 0.015, 10]} />
                  <meshBasicMaterial color={0x09090b} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* 2. Fixed Monobloc 6-Piston Caliper (Mounted at top-rear ~ 12 to 2 o'clock) */}
      <group position={[0, outerRadius * 0.85, outerRadius * 0.45]}>
        {/* Caliper Outer Monobloc Aluminum Bridge & Body */}
        <mesh position={[0, 0, 0]} material={materials.caliperBody}>
          <boxGeometry args={[discThickness + 0.65, 0.82, 1.45]} />
        </mesh>

        {/* Center Cutout Window for Brake Disc & Pad inspection */}
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[discThickness + 0.12, 0.48, 1.2]} />
          <meshBasicMaterial color={0x020617} />
        </mesh>

        {/* Caliper Stiffening Arch & Structural Ribs */}
        <mesh position={[0, 0.42, 0]} material={materials.caliperBody}>
          <boxGeometry args={[0.32, 0.18, 1.3]} />
        </mesh>

        {/* External Hardline Fluid Crossover Bridge Pipe */}
        <group position={[0, 0.45, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.crossoverPipe}>
            <cylinderGeometry args={[0.02, 0.02, discThickness + 0.4, 12]} />
          </mesh>
          {/* Hydraulic Bleeder Screw */}
          <mesh position={[0.22, 0.1, -0.5]} material={materials.driveBobbins}>
            <cylinderGeometry args={[0.03, 0.03, 0.14, 12]} />
          </mesh>
        </group>

        {/* 3. Six Opposed Pistons (3 Inner on X-, 3 Outer on X+) with Staggered Diameters */}
        {/* Outer Pistons (X+) */}
        <group ref={outerPistonsRef} position={[discThickness / 2 + 0.08, 0, 0]}>
          {/* Leading Piston (Small - 30mm) */}
          <mesh position={[0, 0, -0.42]} rotation={[0, 0, Math.PI / 2]} material={materials.pistonTitanium}>
            <cylinderGeometry args={[0.13, 0.13, 0.18, 20]} />
          </mesh>
          {/* Middle Piston (Medium - 34mm) */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.pistonTitanium}>
            <cylinderGeometry args={[0.15, 0.15, 0.18, 20]} />
          </mesh>
          {/* Trailing Piston (Large - 38mm) */}
          <mesh position={[0, 0, 0.42]} rotation={[0, 0, Math.PI / 2]} material={materials.pistonTitanium}>
            <cylinderGeometry args={[0.17, 0.17, 0.18, 20]} />
          </mesh>
        </group>

        {/* Inner Pistons (X-) */}
        <group ref={innerPistonsRef} position={[-discThickness / 2 - 0.08, 0, 0]}>
          {/* Leading Piston */}
          <mesh position={[0, 0, -0.42]} rotation={[0, 0, Math.PI / 2]} material={materials.pistonTitanium}>
            <cylinderGeometry args={[0.13, 0.13, 0.18, 20]} />
          </mesh>
          {/* Middle Piston */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.pistonTitanium}>
            <cylinderGeometry args={[0.15, 0.15, 0.18, 20]} />
          </mesh>
          {/* Trailing Piston */}
          <mesh position={[0, 0, 0.42]} rotation={[0, 0, Math.PI / 2]} material={materials.pistonTitanium}>
            <cylinderGeometry args={[0.17, 0.17, 0.18, 20]} />
          </mesh>
        </group>

        {/* 4. Clamping Brake Pads (Inner and Outer) */}
        {/* Outer Brake Pad Assembly (X+) */}
        <group ref={outerPadRef} position={[discThickness / 2 + 0.04, -0.05, 0]}>
          {/* Steel Backing Plate */}
          <mesh position={[0.04, 0, 0]} material={materials.padBackingPlate}>
            <boxGeometry args={[0.04, 0.42, 1.1]} />
          </mesh>
          {/* Sintered Friction Puck Lining */}
          <mesh position={[-0.02, 0, 0]} material={materials.padFrictionCompound}>
            <boxGeometry args={[0.06, 0.38, 1.05]} />
          </mesh>
          {/* Pad Retaining Pin Guide Ears */}
          <mesh position={[0.04, 0.24, -0.45]} material={materials.padBackingPlate}>
            <boxGeometry args={[0.04, 0.1, 0.12]} />
          </mesh>
          <mesh position={[0.04, 0.24, 0.45]} material={materials.padBackingPlate}>
            <boxGeometry args={[0.04, 0.1, 0.12]} />
          </mesh>
        </group>

        {/* Inner Brake Pad Assembly (X-) */}
        <group ref={innerPadRef} position={[-discThickness / 2 - 0.04, -0.05, 0]}>
          {/* Steel Backing Plate */}
          <mesh position={[-0.04, 0, 0]} material={materials.padBackingPlate}>
            <boxGeometry args={[0.04, 0.42, 1.1]} />
          </mesh>
          {/* Sintered Friction Puck Lining */}
          <mesh position={[0.02, 0, 0]} material={materials.padFrictionCompound}>
            <boxGeometry args={[0.06, 0.38, 1.05]} />
          </mesh>
          {/* Pad Retaining Pin Guide Ears */}
          <mesh position={[-0.04, 0.24, -0.45]} material={materials.padBackingPlate}>
            <boxGeometry args={[0.04, 0.1, 0.12]} />
          </mesh>
          <mesh position={[-0.04, 0.24, 0.45]} material={materials.padBackingPlate}>
            <boxGeometry args={[0.04, 0.1, 0.12]} />
          </mesh>
        </group>

        {/* Anti-Rattle Spring Clip & Retaining Guide Cross-Pins */}
        <group position={[0, 0.24, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, -0.45]} material={materials.pistonTitanium}>
            <cylinderGeometry args={[0.025, 0.025, discThickness + 0.3, 12]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.45]} material={materials.pistonTitanium}>
            <cylinderGeometry args={[0.025, 0.025, discThickness + 0.3, 12]} />
          </mesh>
          {/* Stainless Sheet Spring */}
          <mesh position={[0, 0.05, 0]} material={materials.rotorHat}>
            <boxGeometry args={[discThickness + 0.15, 0.02, 0.65]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
