import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface EngineModelProps {
  rpm?: number;
  throttle?: number;
  exploded?: number; // 0 to 1
  wireframe?: boolean;
  xRayMode?: boolean;
  cutaway?: boolean;
}

/**
 * Procedural Inline-4 Engine with:
 * - Reciprocating pistons via exact Crank-Slider kinematics:
 *   y = r * cos(theta) + sqrt(l^2 - (r * sin(theta))^2)
 * - Connecting rods pivoting between crank journals and wrist pins
 * - Rotating crankshaft with counterweights and flywheel
 * - Dual Overhead Camshafts (DOHC) & intake/exhaust valves with springs
 * - Spark plug flashes matching firing order (1 - 3 - 4 - 2) during top dead center compression
 * - Hot exhaust manifold with dynamic thermal glow based on throttle/RPM
 * - Engine block cutaway housing with cylinder sleeves
 */
export function EngineModel({
  rpm = 2400,
  throttle = 0.5,
  exploded = 0,
  wireframe = false,
  xRayMode = false,
  cutaway = true,
}: EngineModelProps) {
  const crankRef = useRef<THREE.Group>(null);
  const exhaustRef = useRef<THREE.MeshStandardMaterial>(null);

  // 4 cylinders setup
  const cylinderCount = 4;
  const crankRadius = 0.42; // r = stroke / 2
  const conRodLength = 1.35; // l
  const cylinderSpacing = 0.88;
  const cylinderXOffset = -((cylinderCount - 1) * cylinderSpacing) / 2;

  // Firing order: 1 - 3 - 4 - 2
  // Crank throws for flat-plane I4: Cyl 1 & 4 at 0 rad, Cyl 2 & 3 at PI rad
  const crankPhases = useMemo(() => [0, Math.PI, Math.PI, 0], []);
  const cyclePhases = useMemo(() => [0, 1.5 * Math.PI, Math.PI, 0.5 * Math.PI], []);

  // Individual piston, conrod, valve, and spark refs
  const pistonRefs = useRef<(THREE.Group | null)[]>([]);
  const conRodRefs = useRef<(THREE.Group | null)[]>([]);
  const intakeValveRefs = useRef<(THREE.Group | null)[]>([]);
  const exhaustValveRefs = useRef<(THREE.Group | null)[]>([]);
  const sparkRefs = useRef<(THREE.PointLight | null)[]>([]);
  const sparkMeshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Shared Materials
  const materials = useMemo(() => {
    const opacity = xRayMode ? 0.35 : 1.0;
    const transparent = xRayMode;

    return {
      block: new THREE.MeshStandardMaterial({
        color: 0x242830,
        metalness: 0.85,
        roughness: 0.35,
        wireframe,
        transparent,
        opacity: cutaway ? (xRayMode ? 0.25 : 0.88) : opacity,
        side: THREE.DoubleSide,
      }),
      head: new THREE.MeshStandardMaterial({
        color: 0x3a404c,
        metalness: 0.8,
        roughness: 0.4,
        wireframe,
        transparent,
        opacity,
      }),
      crankshaft: new THREE.MeshStandardMaterial({
        color: 0xd0d4dc,
        metalness: 0.95,
        roughness: 0.18,
        wireframe,
      }),
      conRod: new THREE.MeshStandardMaterial({
        color: 0x7c8494,
        metalness: 0.9,
        roughness: 0.3,
        wireframe,
      }),
      piston: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.92,
        roughness: 0.22,
        wireframe,
      }),
      pistonRing: new THREE.MeshStandardMaterial({
        color: 0x1a202c,
        metalness: 0.9,
        roughness: 0.4,
      }),
      valve: new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.25,
        wireframe,
      }),
      camshaft: new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.92,
        roughness: 0.2,
        wireframe,
      }),
      exhaustManifold: new THREE.MeshStandardMaterial({
        color: 0x2d1a15,
        roughness: 0.5,
        metalness: 0.8,
        emissive: new THREE.Color(0xff2200),
        emissiveIntensity: 0.4,
        wireframe,
      }),
      intakePlenum: new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
        metalness: 0.4,
        wireframe,
        transparent,
        opacity,
      }),
      sparkCeramic: new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.15,
        metalness: 0.1,
      }),
      goldBrass: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.3,
        metalness: 0.85,
      }),
    };
  }, [wireframe, xRayMode, cutaway]);

  // Cylinder positions along X axis
  const cylinderPositions = useMemo(() => {
    return Array.from({ length: cylinderCount }, (_, i) => cylinderXOffset + i * cylinderSpacing);
  }, [cylinderCount, cylinderXOffset, cylinderSpacing]);

  // Animation frame loop
  useFrame((_, delta) => {
    // Crank angle calculation: 2 full revolutions = 1 complete 4-stroke cycle (720 deg = 4*PI)
    const effectiveRpm = Math.max(rpm, 0);
    const radPerSec = (effectiveRpm * 2 * Math.PI) / 60;
    const crankIncrement = radPerSec * delta;

    if (crankRef.current) {
      crankRef.current.rotation.x += crankIncrement;
    }

    const currentTheta = crankRef.current ? crankRef.current.rotation.x : 0;
    // Four stroke cycle angle [0, 4*PI]
    const cycleAngle = (currentTheta / 2) % (2 * Math.PI);

    // Update each cylinder's kinematics
    for (let i = 0; i < cylinderCount; i++) {
      const theta = currentTheta + crankPhases[i];
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Crank pin position relative to main journal
      const pinY = crankRadius * cosT;
      const pinZ = crankRadius * sinT;

      // Exact Crank-Slider Equation for wrist pin height (Y)
      // y = r*cos(theta) + sqrt(l^2 - (r*sin(theta))^2)
      const underRadical = Math.max(0, conRodLength * conRodLength - crankRadius * crankRadius * sinT * sinT);
      const pistonY = pinY + Math.sqrt(underRadical);

      // Connecting rod tilt angle (phi)
      // sin(phi) = (r * sin(theta)) / l
      const rodAngle = Math.asin((crankRadius * sinT) / conRodLength);

      // 1. Move Piston
      const pistonGroup = pistonRefs.current[i];
      if (pistonGroup) {
        // Apply exploded offset if any
        pistonGroup.position.y = pistonY + exploded * 0.8;
      }

      // 2. Position & Angle Connecting Rod
      const conRod = conRodRefs.current[i];
      if (conRod) {
        conRod.position.y = pinY;
        conRod.position.z = pinZ;
        conRod.rotation.x = -rodAngle;
      }

      // 3. Four-stroke cycle for valves and spark
      // 0 to PI: Power stroke (Spark at top dead center ~0)
      // PI to 2PI: Exhaust stroke (Exhaust valve open)
      // 2PI to 3PI: Intake stroke (Intake valve open)
      // 3PI to 4PI: Compression stroke
      const cylCycle = (cycleAngle + cyclePhases[i]) % (2 * Math.PI);

      // Spark Plug flash logic (Fires right at top dead center before power stroke)
      const sparkWindow = 0.22; // radians window
      const isFiring = cylCycle < sparkWindow || cylCycle > 2 * Math.PI - 0.05;
      const lightIntensity = isFiring ? 3.5 * (0.6 + throttle * 0.4) : 0;

      const sparkLight = sparkRefs.current[i];
      if (sparkLight) {
        sparkLight.intensity = lightIntensity;
      }

      const sparkMesh = sparkMeshRefs.current[i];
      if (sparkMesh && sparkMesh.material instanceof THREE.MeshBasicMaterial) {
        sparkMesh.material.color.setHex(isFiring ? 0x60a5fa : 0x020617);
      }

      // Intake valve lifts during intake stroke (approx cycle rads PI to 1.5 PI)
      const intakeLift = Math.max(0, Math.sin((cylCycle - Math.PI) * 2)) * 0.12;
      const isIntakeStroke = cylCycle >= Math.PI && cylCycle <= 1.5 * Math.PI;
      const intakeV = intakeValveRefs.current[i];
      if (intakeV) {
        intakeV.position.y = (isIntakeStroke ? -intakeLift : 0) + (exploded * 0.6);
      }

      // Exhaust valve lifts during exhaust stroke (approx cycle rads 0.5 PI to PI)
      const exhaustLift = Math.max(0, Math.sin((cylCycle - 0.5 * Math.PI) * 2)) * 0.12;
      const isExhaustStroke = cylCycle >= 0.5 * Math.PI && cylCycle <= Math.PI;
      const exhaustV = exhaustValveRefs.current[i];
      if (exhaustV) {
        exhaustV.position.y = (isExhaustStroke ? -exhaustLift : 0) + (exploded * 0.6);
      }
    }

    // Dynamic exhaust manifold thermal glow based on RPM and throttle
    if (exhaustRef.current) {
      const heatFactor = (effectiveRpm / 6500) * 0.7 + throttle * 0.6;
      exhaustRef.current.emissiveIntensity = THREE.MathUtils.clamp(heatFactor * 1.5, 0.15, 2.5);
      const hotR = THREE.MathUtils.lerp(0.8, 1.0, heatFactor);
      const hotG = THREE.MathUtils.lerp(0.1, 0.4, heatFactor);
      exhaustRef.current.emissive.setRGB(hotR, hotG, 0.02);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Engine Block with Cutaway Windows */}
      <group position={[0, 0, 0]}>
        {/* Main block structure */}
        <mesh material={materials.block} position={[0, 0.8, 0]}>
          <boxGeometry args={[cylinderSpacing * 4 + 0.5, 2.1, 1.5]} />
        </mesh>

        {/* Cylinder bores / sleeves cutout representation */}
        {cylinderPositions.map((xPos, idx) => (
          <group key={`sleeve-${idx}`} position={[xPos, 0.9, 0]}>
            {/* Cylinder inner bore lining */}
            <mesh rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.38, 0.38, 1.8, 24, 1, true]} />
              <meshStandardMaterial
                color={0x94a3b8}
                metalness={0.9}
                roughness={0.15}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Cylinder head gasket & deck plate */}
            <mesh position={[0, 0.92, 0]}>
              <cylinderGeometry args={[0.42, 0.42, 0.05, 24]} />
              <meshStandardMaterial color={0xd97706} metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Spark plug boss atop each combustion chamber */}
            <group position={[0, 1.95 + exploded * 0.7, 0]}>
              <mesh material={materials.sparkCeramic}>
                <cylinderGeometry args={[0.08, 0.08, 0.35, 16]} />
              </mesh>
              <mesh position={[0, -0.22, 0]} material={materials.goldBrass}>
                <cylinderGeometry args={[0.06, 0.06, 0.15, 16]} />
              </mesh>
              {/* Active Spark Point Light */}
              <pointLight
                ref={(el) => { sparkRefs.current[idx] = el; }}
                color="#60a5fa"
                distance={0.9}
                decay={2}
                intensity={0}
              />
              {/* Spark Arc Glow Mesh */}
              <mesh
                ref={(el) => { sparkMeshRefs.current[idx] = el; }}
                position={[0, -0.32, 0]}
              >
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial color={0x020617} />
              </mesh>
            </group>
          </group>
        ))}

        {/* Crankcase Oil Pan at bottom */}
        <mesh position={[0, -0.6 - exploded * 0.4, 0]} material={materials.block}>
          <boxGeometry args={[cylinderSpacing * 4 + 0.4, 0.55, 1.4]} />
        </mesh>
      </group>

      {/* 2. Cylinder Head & DOHC Camshaft Assembly */}
      <group position={[0, 1.95 + exploded * 0.5, 0]}>
        {/* Head Casing */}
        <mesh material={materials.head} position={[0, 0.25, 0]}>
          <boxGeometry args={[cylinderSpacing * 4 + 0.5, 0.6, 1.6]} />
        </mesh>

        {/* Camshaft 1 (Intake - Rear Z=-0.35) */}
        <group position={[0, 0.45, -0.38]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.camshaft}>
            <cylinderGeometry args={[0.07, 0.07, cylinderSpacing * 4 + 0.4, 16]} />
          </mesh>
          {cylinderPositions.map((xPos, idx) => (
            <mesh key={`cam-intake-lobe-${idx}`} position={[xPos, 0.08, 0]} material={materials.camshaft}>
              <boxGeometry args={[0.12, 0.18, 0.12]} />
            </mesh>
          ))}
        </group>

        {/* Camshaft 2 (Exhaust - Front Z=+0.38) */}
        <group position={[0, 0.45, 0.38]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={materials.camshaft}>
            <cylinderGeometry args={[0.07, 0.07, cylinderSpacing * 4 + 0.4, 16]} />
          </mesh>
          {cylinderPositions.map((xPos, idx) => (
            <mesh key={`cam-exhaust-lobe-${idx}`} position={[xPos, 0.08, 0]} material={materials.camshaft}>
              <boxGeometry args={[0.12, 0.18, 0.12]} />
            </mesh>
          ))}
        </group>

        {/* Cam Gears / Sprockets on timing belt side */}
        <group position={[(cylinderSpacing * 4 + 0.4) / 2 + 0.04, 0.45, 0]}>
          <mesh position={[0, 0, -0.38]} rotation={[0, 0, Math.PI / 2]} material={materials.goldBrass}>
            <cylinderGeometry args={[0.26, 0.26, 0.06, 24]} />
          </mesh>
          <mesh position={[0, 0, 0.38]} rotation={[0, 0, Math.PI / 2]} material={materials.goldBrass}>
            <cylinderGeometry args={[0.26, 0.26, 0.06, 24]} />
          </mesh>
        </group>
      </group>

      {/* 3. Rotating Crankshaft & Flywheel */}
      <group ref={crankRef} position={[0, 0, 0]}>
        {/* Main Journals along central axis */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.crankshaft}>
          <cylinderGeometry args={[0.14, 0.14, cylinderSpacing * 4 + 0.6, 24]} />
        </mesh>

        {/* Flywheel on rear end */}
        <mesh
          position={[-((cylinderSpacing * 4 + 0.6) / 2) - 0.08, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={materials.crankshaft}
        >
          <cylinderGeometry args={[0.85, 0.85, 0.14, 32]} />
        </mesh>

        {/* Harmonic Damper / Crank Pulley on front end */}
        <mesh
          position={[(cylinderSpacing * 4 + 0.6) / 2 + 0.08, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={materials.goldBrass}
        >
          <cylinderGeometry args={[0.42, 0.42, 0.12, 28]} />
        </mesh>

        {/* Crank Webs / Counterweights and Crankpins */}
        {cylinderPositions.map((xPos, idx) => {
          const phase = crankPhases[idx];
          const pinY = crankRadius * Math.cos(phase);
          const pinZ = crankRadius * Math.sin(phase);

          return (
            <group key={`crank-throw-${idx}`} position={[xPos, 0, 0]}>
              {/* Counterweight balancing opposite to crankpin */}
              <mesh position={[0, -pinY * 0.85, -pinZ * 0.85]} material={materials.crankshaft}>
                <boxGeometry args={[0.15, 0.6, 0.5]} />
              </mesh>
              {/* Crankpin offset journal */}
              <mesh position={[0, pinY, pinZ]} rotation={[0, 0, Math.PI / 2]} material={materials.crankshaft}>
                <cylinderGeometry args={[0.11, 0.11, 0.22, 20]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* 4. Pistons, Connecting Rods & Valves per cylinder */}
      {cylinderPositions.map((xPos, idx) => (
        <group key={`cyl-assembly-${idx}`} position={[xPos, 0, 0]}>
          {/* Connecting Rod (Pivots at crankpin) */}
          <group ref={(el) => { conRodRefs.current[idx] = el; }}>
            {/* Rod Big End (around crankpin) */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={materials.conRod}>
              <cylinderGeometry args={[0.18, 0.18, 0.16, 20]} />
            </mesh>
            {/* Rod Beam (H-Beam profile) */}
            <mesh position={[0, conRodLength / 2, 0]} material={materials.conRod}>
              <boxGeometry args={[0.09, conRodLength - 0.2, 0.14]} />
            </mesh>
            {/* Rod Small End (around wrist pin) */}
            <mesh position={[0, conRodLength, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.conRod}>
              <cylinderGeometry args={[0.12, 0.12, 0.14, 20]} />
            </mesh>
          </group>

          {/* Piston Assembly (Reciprocates vertically) */}
          <group ref={(el) => { pistonRefs.current[idx] = el; }}>
            {/* Piston Crown & Skirt */}
            <mesh material={materials.piston}>
              <cylinderGeometry args={[0.36, 0.36, 0.52, 28]} />
            </mesh>
            {/* Compression Rings */}
            <mesh position={[0, 0.14, 0]} material={materials.pistonRing}>
              <cylinderGeometry args={[0.365, 0.365, 0.03, 28]} />
            </mesh>
            <mesh position={[0, 0.06, 0]} material={materials.pistonRing}>
              <cylinderGeometry args={[0.365, 0.365, 0.03, 28]} />
            </mesh>
            {/* Wrist Pin */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={materials.crankshaft}>
              <cylinderGeometry args={[0.07, 0.07, 0.58, 16]} />
            </mesh>
          </group>

          {/* Intake Valve (Offset Z = -0.3) */}
          <group
            ref={(el) => { intakeValveRefs.current[idx] = el; }}
            position={[0, 1.85, -0.32]}
          >
            {/* Valve stem */}
            <mesh material={materials.valve}>
              <cylinderGeometry args={[0.03, 0.03, 0.45, 12]} />
            </mesh>
            {/* Valve spring coil */}
            <mesh position={[0, 0.1, 0]} material={materials.goldBrass}>
              <cylinderGeometry args={[0.07, 0.07, 0.22, 12, 1, true]} />
            </mesh>
            {/* Valve poppet head */}
            <mesh position={[0, -0.22, 0]} material={materials.valve}>
              <cylinderGeometry args={[0.14, 0.04, 0.06, 16]} />
            </mesh>
          </group>

          {/* Exhaust Valve (Offset Z = +0.32) */}
          <group
            ref={(el) => { exhaustValveRefs.current[idx] = el; }}
            position={[0, 1.85, 0.32]}
          >
            {/* Valve stem */}
            <mesh material={materials.valve}>
              <cylinderGeometry args={[0.03, 0.03, 0.45, 12]} />
            </mesh>
            {/* Valve spring coil */}
            <mesh position={[0, 0.1, 0]} material={materials.goldBrass}>
              <cylinderGeometry args={[0.07, 0.07, 0.22, 12, 1, true]} />
            </mesh>
            {/* Valve poppet head */}
            <mesh position={[0, -0.22, 0]} material={materials.valve}>
              <cylinderGeometry args={[0.13, 0.04, 0.06, 16]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* 5. Intake Plenum & Runners (Cold side Z < 0) */}
      <group position={[0, 1.7, -0.7 - exploded * 0.5]}>
        {/* Main intake plenum tube */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.intakePlenum}>
          <cylinderGeometry args={[0.22, 0.22, cylinderSpacing * 4, 20]} />
        </mesh>
        {/* Throttle Body & Air Inlet */}
        <mesh position={[cylinderSpacing * 2 + 0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.head}>
          <cylinderGeometry args={[0.26, 0.26, 0.3, 20]} />
        </mesh>
        {/* Individual curved runner pipes going into cylinder head */}
        {cylinderPositions.map((xPos, idx) => (
          <mesh key={`intake-runner-${idx}`} position={[xPos, -0.15, 0.3]} rotation={[0.4, 0, 0]} material={materials.intakePlenum}>
            <cylinderGeometry args={[0.09, 0.09, 0.45, 16]} />
          </mesh>
        ))}
      </group>

      {/* 6. Hot Exhaust Manifold & 4-into-1 Header (Hot side Z > 0) */}
      <group position={[0, 1.7, 0.7 + exploded * 0.5]}>
        {/* 4 Primary Exhaust Header Pipes */}
        {cylinderPositions.map((xPos, idx) => (
          <group key={`exhaust-pipe-${idx}`} position={[xPos, 0, 0]}>
            <mesh
              position={[0, -0.25, -0.25]}
              rotation={[-0.6, 0, 0]}
            >
              <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
              <primitive object={materials.exhaustManifold} attach="material" />
            </mesh>
          </group>
        ))}

        {/* 4-into-1 Collector */}
        <mesh position={[0, -0.65, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.26, cylinderSpacing * 3.2, 16]} />
          <primitive object={materials.exhaustManifold} attach="material" />
        </mesh>

        {/* Downpipe going back to catalytic converter */}
        <mesh position={[-1.2, -0.9, 0.45]} rotation={[0.5, 0.2, -0.3]}>
          <cylinderGeometry args={[0.18, 0.18, 0.9, 16]} />
          <meshStandardMaterial
            ref={exhaustRef}
            color={0x2d1a15}
            roughness={0.4}
            metalness={0.8}
            emissive={new THREE.Color(0xff3300)}
            emissiveIntensity={0.6}
            wireframe={wireframe}
          />
        </mesh>
      </group>
    </group>
  );
}
