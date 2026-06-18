'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Stage } from '@/components/three/Stage';
import { PALETTE } from '@/lib/tokens';

const SERVICES = ['postgres', 'redis', 'qdrant', 'neo4j', 'api', 'nginx', 'worker', 'gateway'];

function Node({ pos, label, idx }: { pos: [number, number, number]; label: string; idx: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) { const p = 1 + Math.sin(s.clock.elapsedTime * 2 + idx) * 0.08; ref.current.scale.setScalar(p); } });
  const healthy = idx % 7 !== 5;
  return (
    <group position={pos}>
      <mesh ref={ref}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshPhysicalMaterial color={PALETTE.obsidian2} emissive={healthy ? PALETTE.success : PALETTE.danger} emissiveIntensity={0.4} metalness={0.8} roughness={0.25} />
      </mesh>
      <Text position={[0, 0.65, 0]} fontSize={0.16} color={PALETTE.goldBright} anchorX="center" fontWeight={600}>{label}</Text>
    </group>
  );
}

export function InfraScene() {
  const grp = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (grp.current) grp.current.rotation.y += dt * 0.06; });
  return (
    <Stage camera={{ position: [0, 3.5, 9] }} bloom={0.9}>
      <group ref={grp}>
        {SERVICES.map((s, i) => {
          const col = i % 4, row = Math.floor(i / 4);
          return <Node key={s} idx={i} label={s} pos={[(col - 1.5) * 2, 0, (row - 0.5) * 2.4]} />;
        })}
        {/* interconnects */}
        <gridHelper args={[16, 16, PALETTE.goldDeep, '#0e1118']} position={[0, -0.7, 0]} />
      </group>
    </Stage>
  );
}

export default InfraScene;
