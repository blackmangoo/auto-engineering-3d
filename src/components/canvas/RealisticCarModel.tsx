import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { TelemetryData, ViewerSettings } from '../../types/automotive';

// Configure local Draco decoder
useGLTF.setDecoderPath('/draco/');

interface RealisticCarModelProps {
  telemetry: TelemetryData;
  viewerSettings: ViewerSettings;
  effectiveExplode: number;
}

/**
 * High-Fidelity Photorealistic Supercar Model (Ferrari 458 Italia)
 * Loads the official GLTF/GLB model, applies high-end PBR automotive materials:
 * - Multi-layer metallic Rosso Corsa / Carbon paint with clearcoat
 * - Carbon fiber rear diffuser and aerodynamic front splitters
 * - Tinted canopy glass
 * - Dynamic scroll-driven exploded kinematics:
 *   * Body panels & roof elevate on Y-axis
 *   * Glass canopy detaches upward
 *   * 4 wheel corners separate laterally along X-axis
 *   * X-Ray cutaway material reveals internal powertrain
 */
export function RealisticCarModel({
  telemetry,
  viewerSettings,
  effectiveExplode
}: RealisticCarModelProps) {
  // Load official Ferrari 458 GLB
  const { scene } = useGLTF('/models/ferrari.glb', '/draco/');
  const carGroupRef = useRef<THREE.Group>(null);

  // Cloned scene for safe manipulation
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Cached node references for animation & exploded separation
  const nodes = useMemo(() => {
    const map: Record<string, THREE.Object3D> = {};
    clonedScene.traverse((child) => {
      if (child.name) {
        map[child.name] = child;
      }
    });
    return map;
  }, [clonedScene]);

  // Automotive Paint & PBR Materials
  const materials = useMemo(() => {
    const isXRay = viewerSettings.xRayMode;
    const isWire = viewerSettings.wireframe;

    return {
      // Italian Rosso Corsa Multi-Layer Clearcoat Paint
      carPaint: new THREE.MeshPhysicalMaterial({
        color: 0xd91424, // Iconic Rosso Corsa red
        metalness: 0.65,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95,
        wireframe: isWire,
        transparent: isXRay,
        opacity: isXRay ? 0.22 : 1.0,
      }),
      // Raw Carbon Fiber (Aerodynamic wings, splitters, side sills)
      carbon: new THREE.MeshStandardMaterial({
        color: 0x181a1f,
        roughness: 0.45,
        metalness: 0.75,
        wireframe: isWire,
        transparent: isXRay,
        opacity: isXRay ? 0.28 : 1.0,
      }),
      // Tinted Canopy Glass
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x050e18,
        metalness: 0.1,
        roughness: 0.05,
        transmission: isXRay ? 0.95 : 0.82,
        transparent: true,
        opacity: isXRay ? 0.2 : 0.65,
        wireframe: isWire,
      }),
      // Forged Alloy Wheel Rims
      rims: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.14,
        wireframe: isWire,
      }),
      // Tire Rubber
      rubber: new THREE.MeshStandardMaterial({
        color: 0x17181c,
        roughness: 0.88,
        metalness: 0.05,
        wireframe: isWire,
      }),
      // Headlights LED
      headlights: new THREE.MeshBasicMaterial({
        color: 0xe0f7fa,
      }),
      // Taillights
      taillights: new THREE.MeshBasicMaterial({
        color: 0xff1744,
      }),
    };
  }, [viewerSettings.xRayMode, viewerSettings.wireframe]);

  // Apply materials to nodes on mount / updates
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const name = child.name.toLowerCase();
        if (name.includes('body')) {
          child.material = materials.carPaint;
        } else if (name.includes('glass')) {
          child.material = materials.glass;
        } else if (name.includes('carbon')) {
          child.material = materials.carbon;
        } else if (name.includes('rim')) {
          child.material = materials.rims;
        } else if (name.includes('tire')) {
          child.material = materials.rubber;
        } else if (name.includes('light_red')) {
          child.material = materials.taillights;
        } else if (name.includes('light') || name.includes('led')) {
          child.material = materials.headlights;
        }
      }
    });
  }, [clonedScene, materials]);

  // Frame update: Wheel rotation & Exploded View kinematic separation
  useFrame((_, delta) => {
    const wheelRotSpeed = (telemetry.speedKmh / 3.6 / 0.35) * delta;

    // Rotate wheels
    ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].forEach((wheelName) => {
      const wheelNode = nodes[wheelName];
      if (wheelNode) {
        wheelNode.rotation.x += wheelRotSpeed;
      }
    });

    // Kinematic Exploded Separation
    const exp = effectiveExplode;

    // Main body lifts upward along Y
    const bodyNode = nodes['body'];
    if (bodyNode) {
      bodyNode.position.y = THREE.MathUtils.lerp(bodyNode.position.y, exp * 2.2, 0.1);
    }

    // Glass canopy detaches even higher
    const glassNode = nodes['glass'];
    if (glassNode) {
      glassNode.position.y = THREE.MathUtils.lerp(glassNode.position.y, exp * 2.6, 0.1);
    }

    // Carbon aero parts separate
    const carbonNode = nodes['carbon fibre'] || nodes['carbon_fibre_trim'];
    if (carbonNode) {
      carbonNode.position.y = THREE.MathUtils.lerp(carbonNode.position.y, exp * 1.5, 0.1);
    }

    // Front wheels separate outward along X
    const flWheel = nodes['wheel_fl'];
    if (flWheel) {
      flWheel.position.x = THREE.MathUtils.lerp(flWheel.position.x, -exp * 1.4, 0.1);
    }
    const frWheel = nodes['wheel_fr'];
    if (frWheel) {
      frWheel.position.x = THREE.MathUtils.lerp(frWheel.position.x, exp * 1.4, 0.1);
    }

    // Rear wheels separate outward along X
    const rlWheel = nodes['wheel_rl'];
    if (rlWheel) {
      rlWheel.position.x = THREE.MathUtils.lerp(rlWheel.position.x, -exp * 1.4, 0.1);
    }
    const rrWheel = nodes['wheel_rr'];
    if (rrWheel) {
      rrWheel.position.x = THREE.MathUtils.lerp(rrWheel.position.x, exp * 1.4, 0.1);
    }
  });

  return (
    <group ref={carGroupRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} scale={[0.92, 0.92, 0.92]} />
    </group>
  );
}

// Preload the car model
useGLTF.preload('/models/ferrari.glb', '/draco/');
