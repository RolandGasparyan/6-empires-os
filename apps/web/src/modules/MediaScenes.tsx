'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stage } from '@/components/three/Stage';
import { GoldParticles } from '@/components/three/GoldParticles';
import { PALETTE } from '@/lib/tokens';

function Bars({ count = 64 }: { count?: number }) {
  const grp = useRef<THREE.Group>(null);
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame((s) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const h = 0.3 + Math.abs(Math.sin(s.clock.elapsedTime * 2 + i * 0.4)) * (1.5 + Math.sin(i) * 0.8);
      m.scale.y = h; m.position.y = h / 2 - 1.5;
    });
  });
  return (
    <group ref={grp} position={[-(count * 0.16) / 2, 0, 0]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }} position={[i * 0.16, 0, 0]}>
          <boxGeometry args={[0.08, 1, 0.08]} />
          <meshStandardMaterial color={PALETTE.gold} emissive={PALETTE.goldBright} emissiveIntensity={0.5 + (i % 5) * 0.1} />
        </mesh>
      ))}
    </group>
  );
}

export function MusicScene() {
  return (
    <Stage camera={{ position: [0, 1.5, 7] }} bloom={1.3}>
      <GoldParticles count={600} radius={12} />
      <Bars count={72} />
      <gridHelper args={[20, 20, PALETTE.goldDeep, '#11141b']} position={[0, -1.55, 0]} />
    </Stage>
  );
}

export function VideoScene() {
  const grp = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (grp.current) grp.current.rotation.y += dt * 0.15; });
  return (
    <Stage camera={{ position: [0, 1, 8] }} bloom={1.1}>
      <GoldParticles count={500} radius={12} />
      <group ref={grp}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 3, Math.sin(i) * 0.4, Math.sin((i / 5) * Math.PI * 2) * 3]} rotation={[0, -(i / 5) * Math.PI * 2, 0]}>
            <planeGeometry args={[2.2, 1.24]} />
            <meshPhysicalMaterial color={PALETTE.obsidian2} emissive={PALETTE.gold} emissiveIntensity={0.12} metalness={0.7} roughness={0.2} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </Stage>
  );
}
