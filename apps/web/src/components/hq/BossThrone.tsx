'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { AgentAvatar } from './AgentAvatar';

const MARBLE = '#121013';
const GOLD = '#d4af50';
const GOLDB = '#f6d987';

export function BossThrone() {
  const panels = useRef<THREE.Mesh[]>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    panels.current.forEach((p, i) => {
      if (p) (p.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.25 * Math.abs(Math.sin(t * 1.5 + i));
    });
  });
  return (
    <group position={[-8, 0, -3.5]}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[2.2, 2.4, 0.5, 6]} />
        <meshPhysicalMaterial color={MARBLE} metalness={0.55} roughness={0.28} emissive={GOLD} emissiveIntensity={0.05} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.05, 10, 6]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.8} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i - 1) * 0.5;
        return (
          <mesh key={i} ref={(el) => { if (el) panels.current[i] = el; }}
            position={[Math.sin(a) * 1.7, 1.7, Math.cos(a) * -1.7]} rotation={[0, a, 0]}>
            <planeGeometry args={[1.0, 0.62]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      <group position={[0, 0, 1.0]}>
        <AgentAvatar color={GOLDB} emissive={0.45} />
      </group>
      <Text position={[0, 2.5, 1.0]} fontSize={0.26} color={GOLDB} anchorX="center" fontWeight={700}>
        EMPIRE BOSS
      </Text>
    </group>
  );
}
