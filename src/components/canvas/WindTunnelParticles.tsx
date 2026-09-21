import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface WindTunnelParticlesProps {
  visible?: boolean;
  speedKmh?: number;
}

/**
 * Aerodynamic Wind Tunnel Particle Streamlines
 * Procedural streamlines flowing across the vehicle profile to demonstrate
 * laminar flow, boundary layer separation, and rear diffuser wake vortices.
 */
export function WindTunnelParticles({
  visible = true,
  speedKmh = 120,
}: WindTunnelParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 220;

  // Generate streamlines aligned along the car's Z axis (-6 to +6)
  const [positions, initialPositions, colors, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initPos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);

    const cyan = new THREE.Color(0x00e5ff);
    const blue = new THREE.Color(0x3b82f6);
    const orange = new THREE.Color(0xff5e1a);

    for (let i = 0; i < count; i++) {
      // Lateral spread around car width (-2.2 to +2.2)
      const x = (Math.random() - 0.5) * 4.4;
      // Height profile following car aerodynamic contour
      const y = 0.15 + Math.random() * 1.8;
      // Z position spread (-7 front to +7 rear)
      const z = -7 + Math.random() * 14;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;

      spd[i] = 0.8 + Math.random() * 0.4;

      // Color based on height and wake
      const mixCol = y > 1.2 ? cyan : Math.abs(x) < 0.8 && z > 2 ? orange : blue;
      col[i * 3] = mixCol.r;
      col[i * 3 + 1] = mixCol.g;
      col[i * 3 + 2] = mixCol.b;
    }

    return [pos, initPos, col, spd];
  }, []);

  useFrame((_, delta) => {
    if (!visible || !pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const currentPositions = posAttr.array as Float32Array;

    const velocity = Math.max(0.4, (speedKmh / 120) * 8.5) * delta;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Streamlines rush from front (-Z) to rear (+Z)
      currentPositions[idx + 2] += velocity * speeds[i];

      // Streamline curve deflection around body
      const curZ = currentPositions[idx + 2];
      const curX = currentPositions[idx];

      // Hood deflection
      if (curZ > -3.5 && curZ < 0 && Math.abs(curX) < 1.6) {
        currentPositions[idx + 1] = Math.max(initialPositions[idx + 1], 0.6 + Math.cos(curZ) * 0.4);
      }
      // Roof deflection
      else if (curZ >= 0 && curZ < 2.5 && Math.abs(curX) < 1.2) {
        currentPositions[idx + 1] = Math.max(initialPositions[idx + 1], 1.35 + Math.sin(curZ * 0.8) * 0.2);
      }
      // Rear spoiler / diffuser wake
      else if (curZ >= 2.5 && curZ < 5.0) {
        currentPositions[idx + 1] += Math.sin(curZ * 6 + i) * 0.008; // turbulence
      }

      // Reset when exiting downstream tunnel
      if (currentPositions[idx + 2] > 7.0) {
        currentPositions[idx + 2] = -7.0;
        currentPositions[idx] = initialPositions[idx];
        currentPositions[idx + 1] = initialPositions[idx + 1];
      }
    }

    posAttr.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
