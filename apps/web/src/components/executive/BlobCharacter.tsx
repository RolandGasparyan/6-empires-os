'use client';
/**
 * 6 EMPIRES — minimal "blob" character (Arturitu / The Delegation aesthetic).
 * A clean low-poly figure: rounded body + head, single flat color, soft idle
 * bob. No face/hair/suit detail — light, fast, friendly. Replaces the heavy
 * Simpsons-style HumanCharacter for the light minimal world theme.
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Gesture } from './Character';

export interface BlobProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;           // body color (agent identity)
  suit?: string;            // accepted as alias for color (drop-in for HumanCharacter)
  hair?: string; beard?: boolean; glasses?: boolean; bowtie?: boolean;  // ignored
  gesture?: Gesture;
  name?: string;
  status?: string;
  seed?: number;
}

export function BlobCharacter({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, color, suit, gesture = 'idle', name, status, seed = 0 }: BlobProps) {
  const tint = color || suit || '#7c5cff';
  const root = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: tint, roughness: 0.6, metalness: 0.02 }), [tint]);

  useFrame((s) => {
    const t = s.clock.elapsedTime + seed;
    if (root.current) root.current.position.y = position[1] + Math.sin(t * 1.6) * 0.02;
    const R = rArm.current;
    if (R) {
      switch (gesture) {
        case 'type': R.rotation.x = -1.0 + Math.sin(t * 9) * 0.2; break;
        case 'wave': R.rotation.z = -0.5 + Math.sin(t * 8) * 0.5; R.rotation.x = -1.5; break;
        case 'point': R.rotation.x = -1.1; break;
        case 'scan': R.rotation.x = -0.3; break;
        default: R.rotation.x = Math.sin(t * 1.4) * 0.1;
      }
    }
  });

  return (
    <group ref={root} position={position} rotation={rotation} scale={scale}>
      {/* teardrop body */}
      <mesh castShadow position={[0, 0.55, 0]}><capsuleGeometry args={[0.34, 0.55, 6, 14]} /><primitive object={body} attach="material" /></mesh>
      {/* head */}
      <mesh castShadow position={[0, 1.18, 0]}><sphereGeometry args={[0.3, 18, 14]} /><primitive object={body} attach="material" /></mesh>
      {/* simple nub arms */}
      <group ref={rArm} position={[0.32, 0.78, 0]}><mesh position={[0, -0.18, 0]}><capsuleGeometry args={[0.09, 0.3, 4, 8]} /><primitive object={body} attach="material" /></mesh></group>
      <mesh position={[-0.32, 0.6, 0]} rotation={[0, 0, 0.2]}><capsuleGeometry args={[0.09, 0.3, 4, 8]} /><primitive object={body} attach="material" /></mesh>
      {/* soft contact disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><circleGeometry args={[0.36, 20]} /><meshBasicMaterial color="#000" transparent opacity={0.12} /></mesh>

      {name && (
        <Billboard position={[0, 1.75, 0]}>
          <Text fontSize={0.13} color="#f4d98b" anchorX="center" outlineWidth={0.005} outlineColor="#000">{name}</Text>
          {status && <Text position={[0, -0.15, 0]} fontSize={0.08} color={tint} anchorX="center">● {status}</Text>}
        </Billboard>
      )}
    </group>
  );
}
