import { useRef, useMemo, useEffect } from 'react';
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
 * High-Performance Procedural Carbon-Ceramic Brake Assembly
 * Optimized with InstancedMesh for cooling vanes, bobbins, and drill holes
 * to achieve 60 FPS with minimal draw calls.
 */
export function BrakeModel({
  pedalPressure = 0,
  brakeTempC = 350,
  wheelSpeedRpm = 950,
  exploded = 0,
  wireframe = false,
  xRayMode = false,
}: BrakeModelProps) {
  const rotorRef = useRef<THREE.Group>(null);
  const innerPadRef = useRef<THREE.Group>(null);
  const outerPadRef = useRef<THREE.Group>(null);
  const innerPistonsRef = useRef<THREE.Group>(null);
  const outerPistonsRef = useRef<THREE.Group>(null);
  const frictionRingMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Instanced mesh refs
  const vanesInstancedRef = useRef<THREE.InstancedMesh>(null);
  const holesOuterInstancedRef = useRef<THREE.InstancedMesh>(null);
  const holesInnerInstancedRef = useRef<THREE.InstancedMesh>(null);
  const bobbinsInstancedRef = useRef<THREE.InstancedMesh>(null);

  const outerRadius = 1.65;
  const innerRadius = 0.95;
  const discThickness = 0.28;
  const faceThickness = 0.07;
  const vaneCount = 24;
  const holesCount = 28;

  // Shared Materials
  const materials = useMemo(() => {
    const opacity = xRayMode ? 0.35 : 1.0;
    const transparent = xRayMode;

    return {
      caliperBody: new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        metalness: 0.85,
        roughness: 0.25,
        wireframe,
        transparent,
        opacity,
      }),
      rotorHat: new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.92,
        roughness: 0.2,
        wireframe,
      }),
      driveBobbins: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.15,
      }),
      padBackingPlate: new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.4,
      }),
      padFrictionPuck: new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.85,
        metalness: 0.25,
      }),
      pistonChrome: new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.98,
        roughness: 0.1,
      }),
      crossoverPipe: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2,
      }),
      holeDark: new THREE.MeshBasicMaterial({ color: 0x09090b }),
      vaneMaterial: new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.4 }),
    };
  }, [wireframe, xRayMode]);

  // Initialize instanced matrices once on mount
  useEffect(() => {
    const dummy = new THREE.Object3D();

    // 1. Bobbins (10 instances)
    if (bobbinsInstancedRef.current) {
      for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        dummy.position.set(0, Math.cos(angle) * (innerRadius * 0.92), Math.sin(angle) * (innerRadius * 0.92));
        dummy.rotation.set(0, 0, Math.PI / 2);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bobbinsInstancedRef.current.setMatrixAt(i, dummy.matrix);
      }
      bobbinsInstancedRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Vanes (24 instances)
    if (vanesInstancedRef.current) {
      const midR = (outerRadius + innerRadius) / 2;
      for (let i = 0; i < vaneCount; i++) {
        const angle = (i * 2 * Math.PI) / vaneCount;
        dummy.position.set(0, Math.cos(angle) * midR, Math.sin(angle) * midR);
        dummy.rotation.set(0, 0, angle + 0.35);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        vanesInstancedRef.current.setMatrixAt(i, dummy.matrix);
      }
      vanesInstancedRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Drill holes (28 instances)
    const setHoles = (instMesh: THREE.InstancedMesh | null, xPos: number) => {
      if (!instMesh) return;
      const spirals = 7;
      const perSpiral = 4;
      let idx = 0;
      for (let s = 0; s < spirals; s++) {
        const baseTheta = (s * 2 * Math.PI) / spirals;
        for (let h = 0; h < perSpiral; h++) {
          const r = innerRadius + 0.15 + (h / (perSpiral - 1)) * (outerRadius - innerRadius - 0.3);
          const theta = baseTheta + h * 0.15;
          dummy.position.set(xPos, Math.cos(theta) * r, Math.sin(theta) * r);
          dummy.rotation.set(0, 0, Math.PI / 2);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          instMesh.setMatrixAt(idx++, dummy.matrix);
        }
      }
      instMesh.instanceMatrix.needsUpdate = true;
    };

    setHoles(holesOuterInstancedRef.current, discThickness / 2);
    setHoles(holesInnerInstancedRef.current, -discThickness / 2);
  }, [innerRadius, outerRadius, discThickness, vaneCount]);

  // Frame update
  useFrame((_, delta) => {
    // 1. Rotate rotor
    const radPerSec = (wheelSpeedRpm * 2 * Math.PI) / 60;
    if (rotorRef.current) {
      rotorRef.current.rotation.x += radPerSec * delta;
    }

    // 2. Pad clamping under hydraulic pedal pressure
    const clampOffset = (1 - pedalPressure) * 0.05;
    if (innerPadRef.current) {
      innerPadRef.current.position.x = -discThickness / 2 - 0.035 - clampOffset - exploded * 0.35;
    }
    if (outerPadRef.current) {
      outerPadRef.current.position.x = discThickness / 2 + 0.035 + clampOffset + exploded * 0.35;
    }

    // 3. Dynamic Thermal Blackbody Radiative Glow
    if (frictionRingMaterialRef.current) {
      const dynamicTemp = brakeTempC + pedalPressure * 250;
      const normalizedTemp = THREE.MathUtils.clamp((dynamicTemp - 200) / 750, 0, 1);

      if (normalizedTemp > 0.05) {
        frictionRingMaterialRef.current.emissiveIntensity = normalizedTemp * 2.5;
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
      {/* 1. Rotating Brake Disc Rotor */}
      <group ref={rotorRef}>
        {/* Central Aluminum Hat */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.rotorHat}>
          <cylinderGeometry args={[innerRadius * 0.88, innerRadius * 0.88, 0.3, 24]} />
        </mesh>
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.rotorHat}>
          <cylinderGeometry args={[innerRadius * 0.94, innerRadius * 0.94, 0.05, 24]} />
        </mesh>

        {/* Instanced Bobbins */}
        <instancedMesh
          ref={bobbinsInstancedRef}
          args={[undefined, undefined, 10]}
          material={materials.driveBobbins}
        >
          <cylinderGeometry args={[0.045, 0.045, 0.32, 12]} />
        </instancedMesh>

        {/* Outer Carbon-Ceramic Friction Face (Outer) */}
        <mesh position={[discThickness / 2 - faceThickness / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[outerRadius, outerRadius, faceThickness, 32]} />
          <meshStandardMaterial
            ref={frictionRingMaterialRef}
            color={0x2b2d31}
            metalness={0.7}
            roughness={0.35}
            wireframe={wireframe}
            emissive={new THREE.Color(0xff4400)}
            emissiveIntensity={0}
          />
        </mesh>

        {/* Inner Friction Face */}
        <mesh position={[-discThickness / 2 + faceThickness / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[outerRadius, outerRadius, faceThickness, 32]} />
          <meshStandardMaterial
            color={0x2b2d31}
            metalness={0.7}
            roughness={0.35}
            wireframe={wireframe}
          />
        </mesh>

        {/* Instanced Internal Vanes */}
        <instancedMesh
          ref={vanesInstancedRef}
          args={[undefined, undefined, vaneCount]}
          material={materials.vaneMaterial}
        >
          <boxGeometry args={[discThickness - faceThickness * 2, 0.45, 0.03]} />
        </instancedMesh>

        {/* Instanced Drill Holes (Outer & Inner faces) */}
        <instancedMesh
          ref={holesOuterInstancedRef}
          args={[undefined, undefined, holesCount]}
          material={materials.holeDark}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.015, 8]} />
        </instancedMesh>
        <instancedMesh
          ref={holesInnerInstancedRef}
          args={[undefined, undefined, holesCount]}
          material={materials.holeDark}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.015, 8]} />
        </instancedMesh>
      </group>

      {/* 2. Fixed Monobloc 6-Piston Caliper */}
      <group position={[0, outerRadius * 0.85, outerRadius * 0.45]}>
        <mesh material={materials.caliperBody}>
          <boxGeometry args={[discThickness + 0.55, 0.75, 1.35]} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[discThickness + 0.1, 0.42, 1.1]} />
          <meshBasicMaterial color={0x020617} />
        </mesh>
      </group>

      {/* 3. Clamping Brake Pads */}
      <group ref={innerPadRef} position={[-discThickness / 2 - 0.05, outerRadius * 0.85, outerRadius * 0.45]}>
        <mesh material={materials.padBackingPlate}>
          <boxGeometry args={[0.03, 0.38, 0.85]} />
        </mesh>
        <mesh position={[0.02, 0, 0]} material={materials.padFrictionPuck}>
          <boxGeometry args={[0.02, 0.34, 0.8]} />
        </mesh>
      </group>
      <group ref={outerPadRef} position={[discThickness / 2 + 0.05, outerRadius * 0.85, outerRadius * 0.45]}>
        <mesh material={materials.padBackingPlate}>
          <boxGeometry args={[0.03, 0.38, 0.85]} />
        </mesh>
        <mesh position={[-0.02, 0, 0]} material={materials.padFrictionPuck}>
          <boxGeometry args={[0.02, 0.34, 0.8]} />
        </mesh>
      </group>
    </group>
  );
}
