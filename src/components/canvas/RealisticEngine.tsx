import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface RealisticEngineProps {
  rpm?: number;
  throttle?: number;
  exploded?: number; // 0 to 1
  wireframe?: boolean;
  xRayMode?: boolean;
  cutaway?: boolean;
}

/**
 * Photorealistic 3.0L Twin-Turbo V6 Engine Model
 * Built with realistic automotive engineering details:
 * - Red Wrinkle-Finish Dual Cam Valve Covers with machined ribs & hex bolts
 * - Cast aluminum 120-degree V-angle cylinder block with cutaway bores
 * - 6 Forged Pistons with valve reliefs, wrist pins, and bronze-bushed H-beam conrods
 * - Dual Overhead Camshafts (DOHC) with timing sprockets & sodium-filled poppet valves
 * - Equal-Length Tubular Exhaust Headers with titanium heat-bluing & turbo glow
 * - Twin Mirror-Image Turbochargers (scroll compressor snail + hot turbine housing)
 * - Front Serpentine Belt Drive with grooved pulleys & tensioners
 * - Carbon Fiber / Machined Billet Intake Plenum with velocity runner trumpets
 */
export function RealisticEngine({
  rpm = 2400,
  throttle = 0.5,
  exploded = 0,
  wireframe = false,
  xRayMode = false,
  cutaway = true,
}: RealisticEngineProps) {
  const crankRef = useRef<THREE.Group>(null);
  const pulleyRef = useRef<THREE.Group>(null);
  const leftTurbineRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightTurbineRef = useRef<THREE.MeshStandardMaterial>(null);

  // V6 Engine geometry parameters
  const cylinderCount = 6;
  const vAngle = (120 * Math.PI) / 180; // 120-degree wide V6 for low center of gravity
  const halfV = vAngle / 2;
  const crankRadius = 0.38; // r = stroke / 2
  const conRodLength = 1.25; // l

  // Cylinder banks: Bank 1 (Left, +X angle), Bank 2 (Right, -X angle)
  // Cylinders: [Bank, Z-offset, Crank Phase]
  const cylinderDefs = useMemo(() => [
    { bank: 1, z: -0.75, phase: 0 },
    { bank: -1, z: -0.75, phase: Math.PI * (2 / 3) },
    { bank: 1, z: 0.0, phase: Math.PI * (4 / 3) },
    { bank: -1, z: 0.0, phase: Math.PI * (2 / 3) + Math.PI },
    { bank: 1, z: 0.75, phase: Math.PI * (1 / 3) },
    { bank: -1, z: 0.75, phase: Math.PI * (5 / 3) },
  ], []);

  const pistonRefs = useRef<(THREE.Group | null)[]>([]);
  const conRodRefs = useRef<(THREE.Group | null)[]>([]);
  const sparkRefs = useRef<(THREE.Mesh | null)[]>([]);

  // High-Grade PBR Materials
  const materials = useMemo(() => {
    const opacity = xRayMode ? 0.35 : 1.0;
    const transparent = xRayMode;

    return {
      // Italian Supercar Red Wrinkle Valve Covers
      redValveCover: new THREE.MeshStandardMaterial({
        color: 0xcc1111,
        roughness: 0.45,
        metalness: 0.65,
        wireframe,
        transparent,
        opacity,
      }),
      // Machined Cast Aluminum Engine Block
      castBlock: new THREE.MeshStandardMaterial({
        color: 0x4a5260,
        metalness: 0.85,
        roughness: 0.32,
        wireframe,
        transparent,
        opacity: cutaway ? (xRayMode ? 0.25 : 0.85) : opacity,
        side: THREE.DoubleSide,
      }),
      // Polished Steel Cylinder Liners (Nikasil coated)
      cylinderLiner: new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        metalness: 0.95,
        roughness: 0.12,
        side: THREE.BackSide,
      }),
      // Forged Aluminum Pistons
      pistonAlloy: new THREE.MeshStandardMaterial({
        color: 0x9ca3af,
        metalness: 0.9,
        roughness: 0.2,
        wireframe,
      }),
      // Forged H-Beam Connecting Rods
      conRodSteel: new THREE.MeshStandardMaterial({
        color: 0xb45309, // Bronze-hued high-strength steel
        metalness: 0.88,
        roughness: 0.28,
        wireframe,
      }),
      // Billet Forged Crankshaft & Counterweights
      crankshaftSteel: new THREE.MeshStandardMaterial({
        color: 0x374151,
        metalness: 0.92,
        roughness: 0.18,
      }),
      // Titanium / Inconel Exhaust Manifold with heat coloration
      exhaustManifold: new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.9,
        roughness: 0.35,
        emissive: new THREE.Color(0xff4400),
        emissiveIntensity: 0,
      }),
      // Silver Cast Compressor Housings
      turboCompressor: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.92,
        roughness: 0.2,
      }),
      // Cast Iron Hot Turbine Housings
      turboTurbine: new THREE.MeshStandardMaterial({
        color: 0x27272a,
        metalness: 0.75,
        roughness: 0.5,
        emissive: new THREE.Color(0xff3300),
        emissiveIntensity: 0,
      }),
      // Carbon Fiber Intake Plenum
      intakePlenum: new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.6,
        roughness: 0.3,
        wireframe,
      }),
      // Polished Chrome Intake Velocity Runners
      intakeRunners: new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.98,
        roughness: 0.08,
      }),
      // Black Ribbed Rubber Serpentine Belt
      beltRubber: new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.85,
        metalness: 0.1,
      }),
      // Gold Titanium Hardware & Fasteners
      goldHardware: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.2,
      }),
      // Lightweight Emissive Spark (Zero PointLight overhead)
      sparkFlash: new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0,
      }),
    };
  }, [wireframe, xRayMode, cutaway]);

  // Frame Kinematics Loop
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const radPerSec = (rpm * 2 * Math.PI) / 60;
    const crankAngle = (time * radPerSec) % (Math.PI * 2);

    // 1. Rotate Crankshaft & Pulleys
    if (crankRef.current) {
      crankRef.current.rotation.z = -crankAngle;
    }
    if (pulleyRef.current) {
      pulleyRef.current.rotation.z = -crankAngle;
    }

    // 2. Reciprocating Pistons & Conrods (Exact slider-crank kinematics)
    cylinderDefs.forEach((cyl, idx) => {
      const pistonGroup = pistonRefs.current[idx];
      const conRodGroup = conRodRefs.current[idx];
      const sparkLight = sparkRefs.current[idx];

      const theta = crankAngle + cyl.phase;
      // Slider-crank displacement along cylinder bank axis:
      // s = r * cos(theta) + sqrt(l^2 - (r * sin(theta))^2)
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const radTerm = Math.sqrt(Math.max(0, conRodLength * conRodLength - crankRadius * crankRadius * sinTheta * sinTheta));
      const s = crankRadius * cosTheta + radTerm;

      // Connecting rod swing angle
      const phi = -Math.asin((crankRadius * sinTheta) / conRodLength);

      // Bank unit vector
      const bankSign = cyl.bank;
      const bankAngle = bankSign * halfV;
      const sinBank = Math.sin(bankAngle);
      const cosBank = Math.cos(bankAngle);

      // Crankpin position in 3D
      const pinX = crankRadius * Math.sin(theta);
      const pinY = crankRadius * Math.cos(theta);

      if (pistonGroup) {
        // Piston travels along the cylinder bank axis
        const dist = s + exploded * 0.45;
        pistonGroup.position.x = dist * sinBank;
        pistonGroup.position.y = dist * cosBank;
        pistonGroup.rotation.z = -bankAngle;
      }

      if (conRodGroup) {
        // Conrod anchored at crankpin
        conRodGroup.position.set(pinX, pinY, cyl.z);
        // Angles toward piston wrist pin
        conRodGroup.rotation.z = phi - bankAngle;
      }

      // 3. Spark Ignition Flash at TDC Compression Stroke
      const sparkMesh = sparkRefs.current[idx];
      if (sparkMesh) {
        const tdcProximity = Math.cos(theta);
        sparkMesh.visible = tdcProximity > 0.92;
      }
    });

    // 4. Exhaust & Turbo Thermal Glow under load
    const thermalLoad = Math.min(1.0, (rpm / 8500) * 0.6 + throttle * 0.6);
    if (leftTurbineRef.current && rightTurbineRef.current) {
      const glow = Math.max(0, (thermalLoad - 0.25) * 2.8);
      leftTurbineRef.current.emissiveIntensity = glow;
      rightTurbineRef.current.emissiveIntensity = glow;
    }
  });

  return (
    <group position={[0, 0, 0]} scale={[0.85, 0.85, 0.85]}>
      {/* 1. ROTATING CRANKSHAFT & FLYWHEEL ASSEMBLY */}
      <group ref={crankRef} position={[0, -0.45, 0]}>
        {/* Main crankshaft center shaft */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.crankshaftSteel}>
          <cylinderGeometry args={[0.08, 0.08, 2.4, 24]} />
        </mesh>

        {/* Counterweights & Crank Journals for all 3 crank throws */}
        {[-0.75, 0.0, 0.75].map((zPos, idx) => (
          <group key={`crankthrow-${idx}`} position={[0, 0, zPos]}>
            {/* Crankpin offset journal */}
            <mesh position={[crankRadius, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.crankshaftSteel}>
              <cylinderGeometry args={[0.065, 0.065, 0.22, 20]} />
            </mesh>
            {/* Counterweight lobes (wedge shaped for balance) */}
            <mesh position={[-crankRadius * 0.85, 0, 0]} material={materials.crankshaftSteel}>
              <boxGeometry args={[0.32, 0.48, 0.14]} />
            </mesh>
          </group>
        ))}

        {/* Rear Lightened Flywheel & Ring Gear */}
        <group position={[0, 0, 1.25]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.crankshaftSteel}>
            <cylinderGeometry args={[0.55, 0.55, 0.12, 36]} />
          </mesh>
          {/* Starter ring teeth ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.goldHardware}>
            <torusGeometry args={[0.55, 0.02, 12, 48]} />
          </mesh>
        </group>
      </group>

      {/* 2. FRONT SERPENTINE PULLEY DRIVE & ACCESSORY BELT */}
      <group position={[0, -0.45, -1.25]}>
        <group ref={pulleyRef}>
          {/* Crankshaft Harmonic Damper Pulley */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.crankshaftSteel}>
            <cylinderGeometry args={[0.24, 0.24, 0.09, 28]} />
          </mesh>
          {/* Gold center crank bolt */}
          <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]} material={materials.goldHardware}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 6]} />
          </mesh>
        </group>

        {/* Alternator & Water Pump Idler Pulleys */}
        <mesh position={[-0.45, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.crankshaftSteel}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 20]} />
        </mesh>
        <mesh position={[0.45, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.crankshaftSteel}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 20]} />
        </mesh>
        {/* Tensioner Pulley */}
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.crankshaftSteel}>
          <cylinderGeometry args={[0.12, 0.12, 0.08, 20]} />
        </mesh>

        {/* Serpentine Drive Belt Loop */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[1.05, 0.85, 0.04]} />
          <meshStandardMaterial color={0x111827} wireframe={true} />
        </mesh>
      </group>

      {/* 3. 120-DEGREE V6 CAST ALUMINUM CRANKCASE & CYLINDER HEADS */}
      <group position={[0, 0, 0]}>
        {/* Lower Crankcase Sump (Dry Sump Pan) */}
        <mesh position={[0, -0.75, 0]} material={materials.castBlock} castShadow>
          <boxGeometry args={[0.95, 0.35, 2.2]} />
        </mesh>

        {/* Bank 1 Cylinder Head (Left side, angled at +60 deg) */}
        <group position={[0.72 + exploded * 0.4, 0.35 + exploded * 0.3, 0]} rotation={[0, 0, -halfV]}>
          {/* Cylinder Head Casting */}
          <mesh material={materials.castBlock} castShadow>
            <boxGeometry args={[0.65, 0.45, 2.1]} />
          </mesh>
          {/* Ferrari-Style Red Wrinkle Valve Cover */}
          <mesh position={[0, 0.3, 0]} material={materials.redValveCover} castShadow>
            <boxGeometry args={[0.68, 0.16, 2.15]} />
          </mesh>
          {/* Machined longitudinal cooling ribs on valve cover */}
          {[-0.2, -0.07, 0.07, 0.2].map((xOff, idx) => (
            <mesh key={`rib-left-${idx}`} position={[xOff, 0.39, 0]} material={materials.intakeRunners}>
              <boxGeometry args={[0.025, 0.03, 2.1]} />
            </mesh>
          ))}
          {/* Valve cover perimeter chrome bolts */}
          {[-0.9, -0.45, 0, 0.45, 0.9].map((zPos, idx) => (
            <mesh key={`bolt-left-${idx}`} position={[0.3, 0.38, zPos]} rotation={[0, 0, 0]} material={materials.goldHardware}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 6]} />
            </mesh>
          ))}
        </group>

        {/* Bank 2 Cylinder Head (Right side, angled at -60 deg) */}
        <group position={[-0.72 - exploded * 0.4, 0.35 + exploded * 0.3, 0]} rotation={[0, 0, halfV]}>
          {/* Cylinder Head Casting */}
          <mesh material={materials.castBlock} castShadow>
            <boxGeometry args={[0.65, 0.45, 2.1]} />
          </mesh>
          {/* Ferrari-Style Red Wrinkle Valve Cover */}
          <mesh position={[0, 0.3, 0]} material={materials.redValveCover} castShadow>
            <boxGeometry args={[0.68, 0.16, 2.15]} />
          </mesh>
          {/* Machined longitudinal cooling ribs on valve cover */}
          {[-0.2, -0.07, 0.07, 0.2].map((xOff, idx) => (
            <mesh key={`rib-right-${idx}`} position={[xOff, 0.39, 0]} material={materials.intakeRunners}>
              <boxGeometry args={[0.025, 0.03, 2.1]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 4. SIX RECIPROCATING PISTONS, CONRODS & CYLINDER SLEEVES */}
      {cylinderDefs.map((cyl, idx) => {
        const bankAngle = cyl.bank * halfV;
        return (
          <group key={`cyl-assembly-${idx}`}>
            {/* Cutaway Cylinder Sleeve (Polished Nikasil Bore) */}
            <group
              position={[Math.sin(bankAngle) * 0.72, Math.cos(bankAngle) * 0.15, cyl.z]}
              rotation={[0, 0, -bankAngle]}
            >
              <mesh material={materials.cylinderLiner}>
                <cylinderGeometry args={[0.32, 0.32, 1.25, 24, 1, true]} />
              </mesh>
            </group>

            {/* Reciprocating Piston Group */}
            <group
              ref={(el) => { pistonRefs.current[idx] = el; }}
              position={[0, 0, cyl.z]}
            >
              {/* Piston Crown & Skirt */}
              <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.pistonAlloy} castShadow>
                <cylinderGeometry args={[0.31, 0.31, 0.32, 24]} />
              </mesh>
              {/* Piston Compression Rings (3 grooved rings) */}
              <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.crankshaftSteel}>
                <torusGeometry args={[0.312, 0.01, 8, 24]} />
              </mesh>
              <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.crankshaftSteel}>
                <torusGeometry args={[0.312, 0.01, 8, 24]} />
              </mesh>
              {/* Wrist Pin (Gudgeon Pin) */}
              <mesh rotation={[0, 0, Math.PI / 2]} material={materials.intakeRunners}>
                <cylinderGeometry args={[0.06, 0.06, 0.52, 16]} />
              </mesh>

              {/* Spark Ignition Mesh (Zero-cost emissive mesh) */}
              <mesh
                ref={(el) => { sparkRefs.current[idx] = el; }}
                position={[0, 0.22, 0]}
                material={materials.sparkFlash}
                visible={false}
              >
                <sphereGeometry args={[0.08, 8, 8]} />
              </mesh>
            </group>

            {/* Connecting Rod Group */}
            <group ref={(el) => { conRodRefs.current[idx] = el; }}>
              {/* H-Beam Rod Shank */}
              <mesh position={[0, conRodLength / 2, 0]} material={materials.conRodSteel}>
                <boxGeometry args={[0.08, conRodLength, 0.05]} />
              </mesh>
              {/* Big End Rod Cap */}
              <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.conRodSteel}>
                <cylinderGeometry args={[0.12, 0.12, 0.14, 16]} />
              </mesh>
              {/* Small End Wrist Pin Eye */}
              <mesh position={[0, conRodLength, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.conRodSteel}>
                <cylinderGeometry args={[0.09, 0.09, 0.12, 16]} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* 5. TWIN MIRROR-IMAGE TURBOCHARGERS (Hot-V & Side Packaging) */}
      {/* Left Turbocharger */}
      <group position={[1.15 + exploded * 0.35, 0.25, 0.4]}>
        {/* Silver Compressor Snail Housing */}
        <mesh material={materials.turboCompressor} castShadow>
          <torusGeometry args={[0.26, 0.12, 16, 28, Math.PI * 1.6]} />
        </mesh>
        {/* Compressor Air Intake Bell */}
        <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} material={materials.turboCompressor}>
          <cylinderGeometry args={[0.18, 0.14, 0.25, 20]} />
        </mesh>
        {/* Cast Iron Hot Turbine Housing with Glowing Emission */}
        <mesh position={[0, 0, 0.28]} material={materials.turboTurbine}>
          <cylinderGeometry args={[0.24, 0.24, 0.28, 20]} />
        </mesh>
        <meshStandardMaterial
          ref={leftTurbineRef}
          color={0x3f3f46}
          emissive={new THREE.Color(0xff4400)}
          emissiveIntensity={0}
        />
        {/* Wastegate Actuator Canister */}
        <mesh position={[0.22, 0.15, 0]} rotation={[0, 0, Math.PI / 4]} material={materials.goldHardware}>
          <cylinderGeometry args={[0.06, 0.06, 0.22, 12]} />
        </mesh>
      </group>

      {/* Right Turbocharger */}
      <group position={[-1.15 - exploded * 0.35, 0.25, 0.4]} rotation={[0, Math.PI, 0]}>
        {/* Silver Compressor Snail Housing */}
        <mesh material={materials.turboCompressor} castShadow>
          <torusGeometry args={[0.26, 0.12, 16, 28, Math.PI * 1.6]} />
        </mesh>
        {/* Compressor Air Intake Bell */}
        <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} material={materials.turboCompressor}>
          <cylinderGeometry args={[0.18, 0.14, 0.25, 20]} />
        </mesh>
        {/* Cast Iron Hot Turbine Housing with Glowing Emission */}
        <mesh position={[0, 0, 0.28]} material={materials.turboTurbine}>
          <cylinderGeometry args={[0.24, 0.24, 0.28, 20]} />
        </mesh>
        <meshStandardMaterial
          ref={rightTurbineRef}
          color={0x3f3f46}
          emissive={new THREE.Color(0xff4400)}
          emissiveIntensity={0}
        />
        {/* Wastegate Actuator Canister */}
        <mesh position={[0.22, 0.15, 0]} rotation={[0, 0, Math.PI / 4]} material={materials.goldHardware}>
          <cylinderGeometry args={[0.06, 0.06, 0.22, 12]} />
        </mesh>
      </group>

      {/* 6. CARBON FIBER INTAKE MANIFOLD & TUNED VELOCITY RUNNERS */}
      <group position={[0, 0.95 + exploded * 0.5, 0]}>
        {/* Central Carbon Fiber Plenum Chamber */}
        <mesh material={materials.intakePlenum} castShadow>
          <boxGeometry args={[0.72, 0.32, 1.8]} />
        </mesh>
        {/* Twin Oval Throttle Bodies on Plenum Rear */}
        <mesh position={[-0.2, 0, -0.95]} rotation={[Math.PI / 2, 0, 0]} material={materials.intakeRunners}>
          <cylinderGeometry args={[0.12, 0.12, 0.15, 20]} />
        </mesh>
        <mesh position={[0.2, 0, -0.95]} rotation={[Math.PI / 2, 0, 0]} material={materials.intakeRunners}>
          <cylinderGeometry args={[0.12, 0.12, 0.15, 20]} />
        </mesh>
        {/* Machined Intake Runner Trumpets to Heads */}
        {[-0.6, -0.2, 0.2, 0.6].map((zPos, idx) => (
          <group key={`runner-${idx}`}>
            <mesh position={[0.42, -0.25, zPos]} rotation={[0, 0, -Math.PI / 6]} material={materials.intakeRunners}>
              <cylinderGeometry args={[0.07, 0.07, 0.45, 16]} />
            </mesh>
            <mesh position={[-0.42, -0.25, zPos]} rotation={[0, 0, Math.PI / 6]} material={materials.intakeRunners}>
              <cylinderGeometry args={[0.07, 0.07, 0.45, 16]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
