'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Stage } from '@/components/three/Stage';
import { GoldParticles } from '@/components/three/GoldParticles';
import { PALETTE } from '@/lib/tokens';
import { EMPIRE_AGENTS } from '@/data/mock';

const STATUS_COLOR: Record<string, string> = {
  executing: PALETTE.success, thinking: PALETTE.cyan, idle: PALETTE.gold, offline: PALETTE.danger,
};

function AgentNode({ angle, idx }: { angle: number; idx: number }) {
  const a = EMPIRE_AGENTS[idx];
  const ref = useRef<THREE.Group>(null);
  const R = 4.2;
  const x = Math.cos(angle) * R, z = Math.sin(angle) * R;
  useFrame((s) => {
    if (ref.current) ref.current.position.y = Math.sin(s.clock.elapsedTime * 0.9 + idx) * 0.12 + a.load * 0.6;
  });
  const color = STATUS_COLOR[a.status];
  return (
    <group ref={ref} position={[x, 0, z]}>
      <Line points={[[0, 0, 0], [-x, 0.2, -z]]} color={color} lineWidth={0.6} transparent opacity={0.22} />
      <mesh>
        <octahedronGeometry args={[0.42 + a.load * 0.25, 0]} />
        <meshPhysicalMaterial color={PALETTE.obsidian2} emissive={color} emissiveIntensity={0.5} metalness={0.85} roughness={0.2} />
      </mesh>
      <Text position={[0, 0.85, 0]} fontSize={0.2} color={PALETTE.goldBright} anchorX="center" fontWeight={700}>{a.name}</Text>
      <Text position={[0, 0.58, 0]} fontSize={0.11} color="#8a90a0" anchorX="center" letterSpacing={0.1}>{a.role.toUpperCase()}</Text>
    </group>
  );
}

export function AgentsScene() {
  return (
    <Stage camera={{ position: [0, 4.5, 8.5], fov: 46 }} bloom={1.0}>
      <GoldParticles count={900} radius={14} />
      {/* CEO core */}
      <mesh position={[0, 0, 0]}>
        <dodecahedronGeometry args={[1.1, 0]} />
        <meshPhysicalMaterial color={PALETTE.obsidian2} emissive={PALETTE.gold} emissiveIntensity={0.4} metalness={0.95} roughness={0.1} />
      </mesh>
      <Text position={[0, 1.7, 0]} fontSize={0.24} color={PALETTE.goldBright} anchorX="center" fontWeight={800}>EMPIRE CORE</Text>
      {EMPIRE_AGENTS.map((_, i) => (
        <AgentNode key={i} idx={i} angle={(i / EMPIRE_AGENTS.length) * Math.PI * 2} />
      ))}
      {/* base grid */}
      <gridHelper args={[24, 24, PALETTE.goldDeep, '#11141b']} position={[0, -2.4, 0]} />
    </Stage>
  );
}

export default AgentsScene;
