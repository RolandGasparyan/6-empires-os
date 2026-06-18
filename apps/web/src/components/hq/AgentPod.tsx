'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { AgentAvatar } from './AgentAvatar';
import { HQAgent, STATUS_COLOR } from '@/data/hqAgents';

const MARBLE = '#121013';
const GOLD = '#d4af50';

export function AgentPod({ agent, selected, onSelect }: { agent: HQAgent; selected: boolean; onSelect: () => void; }) {
  const ring = useRef<THREE.Mesh>(null);
  const mons = useRef<THREE.Mesh[]>([]);
  const statusCol = STATUS_COLOR[agent.status] ?? agent.color;
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ring.current) {
      ring.current.scale.setScalar(1 + 0.05 * Math.sin(t * 2.5));
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.3 * Math.abs(Math.sin(t * 2));
    }
    mons.current.forEach((m, i) => {
      if (m) (m.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.32 * Math.abs(Math.sin(t * 2 + i));
    });
  });
  return (
    <group position={agent.pos} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[1.3, 1.4, 0.18, 28]} />
        <meshPhysicalMaterial color={MARBLE} metalness={0.55} roughness={0.28} emissive={agent.color} emissiveIntensity={0.04} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.19, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.035, 10, 40]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.68, 0.45]}>
        <boxGeometry args={[1.7, 0.1, 0.8]} />
        <meshPhysicalMaterial color={MARBLE} metalness={0.55} roughness={0.28} emissive={GOLD} emissiveIntensity={0.04} />
      </mesh>
      {[0, 1, 2].map((mi) => (
        <mesh key={mi} ref={(el) => { if (el) mons.current[mi] = el; }} position={[-0.56 + mi * 0.56, 1.0, 0.78]} rotation={[0, (1 - mi) * 0.26, 0]}>
          <planeGeometry args={[0.5, 0.32]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <group position={[0, 0, -0.25]}>
        <AgentAvatar color={agent.color} seed={agent.pos[0] + agent.pos[2]} emissive={selected ? 0.6 : 0.38} />
      </group>
      <mesh ref={ring} position={[0, 0.2, -0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.48, 28]} />
        <meshBasicMaterial color={statusCol} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, 2.0, -0.25]} fontSize={0.22} color={agent.color} anchorX="center" fontWeight={600}>
        {agent.name}
      </Text>
    </group>
  );
}
