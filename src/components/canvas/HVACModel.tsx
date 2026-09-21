import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface HVACModelProps {
  compressorRpm?: number; // 0 to 4500
  ambientTempC?: number; // 35C hot ambient
  cabinTempC?: number; // 21C target
  blowerSpeed?: number; // 0 to 1
  exploded?: number; // 0 to 1
  wireframe?: boolean;
  xRayMode?: boolean;
}

/**
 * Procedural Automotive HVAC System (Vapor Compression Refrigeration Cycle) with:
 * - Variable-Displacement Swashplate AC Compressor:
 *   - Rotating swashplate, reciprocating pistons, drive pulley, and magnetic clutch
 * - Micro-Channel Condenser Coil with cooling radiator fins & electric fan
 * - Thermal Expansion Valve (TXV) with metering orifice and sensing bulb capillary
 * - Cabin Evaporator Core with squirrel-cage blower fan
 * - Thermodynamic Refrigerant Particle Flow Cycle:
 *   - High-Pressure Hot Superheated Vapor (Red -> Hot Orange) from compressor to condenser
 *   - High-Pressure Subcooled Liquid (Warm Yellow -> Green) from condenser through dryer to TXV
 *   - Low-Pressure Two-Phase Cold Boiling Liquid/Vapor (Cyan -> Ice Blue) expanding into evaporator
 *   - Low-Pressure Superheated Vapor (Deep Cold Blue) returning through suction line to compressor
 */
export function HVACModel({
  compressorRpm = 1800,
  blowerSpeed = 0.7,
  exploded = 0,
  wireframe = false,
  xRayMode = false,
}: HVACModelProps) {
  // Mechanical rotating refs
  const swashplateRef = useRef<THREE.Group>(null);
  const compressorPulleyRef = useRef<THREE.Group>(null);
  const condenserFanRef = useRef<THREE.Group>(null);
  const blowerFanRef = useRef<THREE.Group>(null);

  // Thermodynamic refrigerant particle system
  const particlePointsRef = useRef<THREE.Points>(null);

  // Component Positions in 3D scene (Loop layout)
  // Compressor: [-1.8, -0.6, 0]
  // Condenser (Front of car): [0, 0.7, 1.2]
  // Receiver-Dryer: [1.6, 0.4, 1.0]
  // TXV Valve: [1.8, -0.4, -0.4]
  // Evaporator Core (Inside dashboard/cabin): [0, -0.5, -1.2]
  const componentCoords = useMemo(
    () => ({
      compressor: new THREE.Vector3(-1.6, -0.5, 0),
      condenser: new THREE.Vector3(0, 0.6, 1.1),
      dryer: new THREE.Vector3(1.5, 0.2, 0.8),
      txv: new THREE.Vector3(1.6, -0.4, -0.5),
      evaporator: new THREE.Vector3(0, -0.5, -1.1),
    }),
    []
  );

  // Closed continuous spline path representing the refrigeration loop
  const loopCurve = useMemo(() => {
    const p1 = new THREE.Vector3(-1.6, -0.3, 0.2); // Compressor discharge port
    const p2 = new THREE.Vector3(-0.9, 0.4, 0.9); // Discharge line to condenser
    const p3 = new THREE.Vector3(0, 0.6, 1.1); // Condenser inlet
    const p4 = new THREE.Vector3(0.9, 0.5, 1.1); // Condenser outlet
    const p5 = new THREE.Vector3(1.5, 0.2, 0.8); // Receiver/Dryer
    const p6 = new THREE.Vector3(1.6, -0.1, 0.2); // High side liquid line
    const p7 = new THREE.Vector3(1.6, -0.4, -0.5); // TXV inlet
    const p8 = new THREE.Vector3(1.1, -0.5, -0.9); // Low side cold line to evaporator
    const p9 = new THREE.Vector3(0, -0.5, -1.1); // Evaporator core
    const p10 = new THREE.Vector3(-1.0, -0.5, -0.8); // Suction line back
    const p11 = new THREE.Vector3(-1.6, -0.5, -0.3); // Compressor suction port

    return new THREE.CatmullRomCurve3([p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11], true);
  }, []);

  // Shared Materials
  const materials = useMemo(() => {
    const opacity = xRayMode ? 0.35 : 1.0;
    const transparent = xRayMode;

    return {
      compressorBody: new THREE.MeshStandardMaterial({
        color: 0x334155, // Cast aluminum compressor body
        metalness: 0.85,
        roughness: 0.35,
        wireframe,
        transparent,
        opacity,
      }),
      pulleySteel: new THREE.MeshStandardMaterial({
        color: 0x0f172a, // Black serpentine ribbed pulley
        metalness: 0.9,
        roughness: 0.3,
      }),
      clutchPlate: new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.95,
        roughness: 0.2,
      }),
      condenserAlu: new THREE.MeshStandardMaterial({
        color: 0x94a3b8, // Extruded aluminum microchannel tubes
        metalness: 0.9,
        roughness: 0.25,
        wireframe,
      }),
      fanPlastic: new THREE.MeshStandardMaterial({
        color: 0x18181b, // Polypropylene fan blades
        roughness: 0.6,
        metalness: 0.2,
      }),
      txvBrass: new THREE.MeshStandardMaterial({
        color: 0xd97706, // Solid machined brass valve body
        metalness: 0.88,
        roughness: 0.25,
      }),
      dryerCanister: new THREE.MeshStandardMaterial({
        color: 0x475569, // Aluminum accumulator canister
        metalness: 0.9,
        roughness: 0.2,
      }),
      evaporatorCore: new THREE.MeshStandardMaterial({
        color: 0x38bdf8, // Cold frosted aluminum core
        metalness: 0.8,
        roughness: 0.35,
        wireframe,
      }),
      copperLine: new THREE.MeshStandardMaterial({
        color: 0xb45309,
        metalness: 0.9,
        roughness: 0.2,
      }),
    };
  }, [wireframe, xRayMode]);

  // Particle positions & thermodynamic colors allocation
  const particleCount = 240;
  const particleOffsets = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => i / particleCount);
  }, [particleCount]);

  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const pt = loopCurve.getPoint(t);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;

      // Color coding along the refrigeration cycle:
      // t in [0.0, 0.25]: High-Pressure Hot Discharge (Red -> Orange: 85°C, 220 psi)
      // t in [0.25, 0.55]: Condensing / Subcooling Liquid (Orange -> Yellow-Green: 45°C, 210 psi)
      // t in [0.55, 0.80]: Post-TXV Expansion Flash Gas (Cyan -> Ice Cold: 3°C, 30 psi)
      // t in [0.80, 1.00]: Superheated Cold Suction Gas (Electric Deep Blue: 8°C, 28 psi)
      let r = 0;
      let g = 0;
      let b = 0;

      if (t < 0.25) {
        // Red to orange
        r = 1.0;
        g = 0.2 + (t / 0.25) * 0.4;
        b = 0.05;
      } else if (t < 0.55) {
        // Orange-Yellow to green
        const lt = (t - 0.25) / 0.3;
        r = 1.0 - lt * 0.7;
        g = 0.6 + lt * 0.3;
        b = 0.1;
      } else if (t < 0.8) {
        // Cyan to ice blue
        const lt = (t - 0.55) / 0.25;
        r = 0.1 + lt * 0.1;
        g = 0.85 - lt * 0.2;
        b = 1.0;
      } else {
        // Electric deep blue returning to compressor
        const lt = (t - 0.8) / 0.2;
        r = 0.2 - lt * 0.1;
        g = 0.4 - lt * 0.2;
        b = 1.0;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [loopCurve, particleCount]);

  // Frame animation
  useFrame((_, delta) => {
    // 1. Rotate compressor swashplate & drive pulley
    const radPerSec = (compressorRpm * 2 * Math.PI) / 60;
    if (compressorPulleyRef.current) {
      compressorPulleyRef.current.rotation.x += radPerSec * delta;
    }
    if (swashplateRef.current) {
      swashplateRef.current.rotation.x += radPerSec * delta;
    }

    // 2. Condenser electric cooling fan
    if (condenserFanRef.current) {
      condenserFanRef.current.rotation.z += (radPerSec * 0.75 + 10) * delta;
    }

    // 3. Cabin blower squirrel-cage fan
    if (blowerFanRef.current) {
      blowerFanRef.current.rotation.y += blowerSpeed * 35 * delta;
    }

    // 4. Propagate refrigerant particle flow along closed loopCurve
    if (particlePointsRef.current) {
      const posAttr = particlePointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const speed = (compressorRpm / 1800) * 0.18 + 0.05;

      for (let i = 0; i < particleCount; i++) {
        particleOffsets[i] = (particleOffsets[i] + speed * delta) % 1.0;
        const pt = loopCurve.getPoint(particleOffsets[i]);
        posAttr.setXYZ(i, pt.x, pt.y, pt.z);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Variable-Displacement Swashplate AC Compressor */}
      <group position={[componentCoords.compressor.x - exploded * 0.4, componentCoords.compressor.y, componentCoords.compressor.z]}>
        {/* Main Aluminum Compressor Housing Barrel */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.compressorBody}>
          <cylinderGeometry args={[0.42, 0.42, 0.95, 24]} />
        </mesh>
        {/* Cylinder Head / Valve Plate Casting */}
        <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.compressorBody}>
          <cylinderGeometry args={[0.44, 0.44, 0.15, 24]} />
        </mesh>

        {/* Serpentine Belt Drive Pulley & Electromagnetic Clutch Face */}
        <group ref={compressorPulleyRef} position={[0.55, 0, 0]}>
          {/* Ribbed Pulley Ring */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.pulleySteel}>
            <cylinderGeometry args={[0.5, 0.5, 0.14, 32]} />
          </mesh>
          {/* Front Clutch Armature Hub Plate with 3 Leaf Springs */}
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.clutchPlate}>
            <cylinderGeometry args={[0.44, 0.44, 0.04, 6]} />
          </mesh>
        </group>

        {/* Internal Swashplate visible in Cutaway */}
        <group ref={swashplateRef} position={[0, 0, 0]}>
          {/* Angled Wobble / Swashplate Disc (~18 deg tilt) */}
          <mesh rotation={[0, 0, 0.32]} material={materials.clutchPlate}>
            <cylinderGeometry args={[0.32, 0.32, 0.06, 20]} />
          </mesh>
          {/* Central drive shaft */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.clutchPlate}>
            <cylinderGeometry args={[0.07, 0.07, 0.85, 16]} />
          </mesh>
        </group>

        {/* Service Ports (High side / Low side schrader valves) */}
        <mesh position={[-0.25, 0.45, 0.18]} material={materials.txvBrass}>
          <cylinderGeometry args={[0.04, 0.04, 0.14, 12]} />
        </mesh>
        <mesh position={[-0.25, 0.45, -0.18]} material={materials.txvBrass}>
          <cylinderGeometry args={[0.04, 0.04, 0.14, 12]} />
        </mesh>
      </group>

      {/* 2. Micro-Channel Condenser Core & Electric Cooling Fan */}
      <group position={[componentCoords.condenser.x, componentCoords.condenser.y + exploded * 0.3, componentCoords.condenser.z + exploded * 0.4]}>
        {/* Condenser Frame & Tanks */}
        <mesh position={[0, 0, 0]} material={materials.condenserAlu}>
          <boxGeometry args={[1.8, 1.1, 0.1]} />
        </mesh>
        {/* Left and Right Aluminum Manifold Header Pipes */}
        <mesh position={[-0.92, 0, 0]} material={materials.condenserAlu}>
          <cylinderGeometry args={[0.06, 0.06, 1.15, 16]} />
        </mesh>
        <mesh position={[0.92, 0, 0]} material={materials.condenserAlu}>
          <cylinderGeometry args={[0.06, 0.06, 1.15, 16]} />
        </mesh>

        {/* Horizontal Microchannel Extruded Tube Ribs */}
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={`condenser-tube-${i}`} position={[0, -0.45 + i * 0.11, 0]} material={materials.condenserAlu}>
            <boxGeometry args={[1.76, 0.035, 0.08]} />
          </mesh>
        ))}

        {/* Electric Cooling Fan Shroud & High-Flow Blades */}
        <group position={[0, 0, -0.15]}>
          {/* Fan Shroud Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.fanPlastic}>
            <cylinderGeometry args={[0.44, 0.44, 0.06, 32, 1, true]} />
          </mesh>
          {/* Rotating Multi-Blade Impeller */}
          <group ref={condenserFanRef}>
            {/* Center Motor Hub */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.fanPlastic}>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
            </mesh>
            {/* 7 Swept Fan Blades */}
            {Array.from({ length: 7 }).map((_, bi) => {
              const bAngle = (bi * 2 * Math.PI) / 7;
              return (
                <mesh
                  key={`fan-blade-${bi}`}
                  position={[Math.cos(bAngle) * 0.25, Math.sin(bAngle) * 0.25, 0]}
                  rotation={[0, 0, bAngle + 0.4]}
                  material={materials.fanPlastic}
                >
                  <boxGeometry args={[0.26, 0.08, 0.02]} />
                </mesh>
              );
            })}
          </group>
        </group>
      </group>

      {/* 3. Receiver-Dryer / Accumulator Filter Canister */}
      <group position={[componentCoords.dryer.x + exploded * 0.3, componentCoords.dryer.y, componentCoords.dryer.z]}>
        {/* Main Vertical Cylindrical Desiccant Tank */}
        <mesh material={materials.dryerCanister}>
          <cylinderGeometry args={[0.14, 0.14, 0.72, 20]} />
        </mesh>
        {/* Domed Top & Bottom Caps */}
        <mesh position={[0, 0.36, 0]} material={materials.dryerCanister}>
          <sphereGeometry args={[0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, -0.36, 0]} rotation={[Math.PI, 0, 0]} material={materials.dryerCanister}>
          <sphereGeometry args={[0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* Sight Glass on Top */}
        <mesh position={[0, 0.48, 0]} material={materials.txvBrass}>
          <cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
        </mesh>
      </group>

      {/* 4. Thermal Expansion Valve (TXV) Block */}
      <group position={[componentCoords.txv.x + exploded * 0.2, componentCoords.txv.y, componentCoords.txv.z - exploded * 0.2]}>
        {/* Machined Block Body with Dual Flow Passages */}
        <mesh material={materials.txvBrass}>
          <boxGeometry args={[0.22, 0.32, 0.18]} />
        </mesh>
        {/* Sensing Diaphragm Power Head Dome */}
        <mesh position={[0, 0.2, 0]} material={materials.copperLine}>
          <cylinderGeometry args={[0.14, 0.1, 0.1, 16]} />
        </mesh>
        {/* Capillary Sensing Tube to Suction Line */}
        <mesh position={[-0.15, 0.15, 0]} rotation={[0, 0, 0.6]} material={materials.copperLine}>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 10]} />
        </mesh>
        {/* Internal Metering Orifice Pin */}
        <mesh position={[0, -0.05, 0]} material={materials.clutchPlate}>
          <cylinderGeometry args={[0.02, 0.005, 0.14, 12]} />
        </mesh>
      </group>

      {/* 5. Cabin Evaporator Core & Squirrel-Cage HVAC Blower Fan */}
      <group position={[componentCoords.evaporator.x, componentCoords.evaporator.y - exploded * 0.3, componentCoords.evaporator.z - exploded * 0.4]}>
        {/* Frosted Aluminum Laminated Fin Evaporator Core */}
        <mesh position={[-0.35, 0, 0]} material={materials.evaporatorCore}>
          <boxGeometry args={[0.95, 0.8, 0.45]} />
        </mesh>

        {/* Evaporator fin textures */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`evap-fin-${i}`} position={[-0.35, -0.3 + i * 0.12, 0]} material={materials.evaporatorCore}>
            <boxGeometry args={[0.96, 0.02, 0.46]} />
          </mesh>
        ))}

        {/* Squirrel-Cage Centrifugal Blower Housing */}
        <group position={[0.55, 0, 0]}>
          {/* Scroll Housing */}
          <mesh material={materials.fanPlastic}>
            <cylinderGeometry args={[0.34, 0.34, 0.45, 24, 1, true]} />
          </mesh>

          {/* Rotating Centrifugal Impeller Drum */}
          <group ref={blowerFanRef}>
            {Array.from({ length: 16 }).map((_, vi) => {
              const vAngle = (vi * 2 * Math.PI) / 16;
              return (
                <mesh
                  key={`blower-blade-${vi}`}
                  position={[Math.cos(vAngle) * 0.28, 0, Math.sin(vAngle) * 0.28]}
                  rotation={[0, -vAngle, 0]}
                  material={materials.fanPlastic}
                >
                  <boxGeometry args={[0.02, 0.4, 0.05]} />
                </mesh>
              );
            })}
          </group>

          {/* Air Outlet Duct pushing chilled air into cabin */}
          <mesh position={[0, 0.3, 0.22]} rotation={[0.4, 0, 0]} material={materials.fanPlastic}>
            <boxGeometry args={[0.38, 0.22, 0.3]} />
          </mesh>
        </group>
      </group>

      {/* 6. Refrigerant Hardline Circuit Piping (Tube along loopCurve) */}
      <mesh material={materials.copperLine}>
        <tubeGeometry args={[loopCurve, 180, 0.032, 12, true]} />
      </mesh>

      {/* 7. Thermodynamic Refrigerant Flow Particle System */}
      <points ref={particlePointsRef} geometry={particleGeometry}>
        <pointsMaterial
          size={0.075}
          vertexColors
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
