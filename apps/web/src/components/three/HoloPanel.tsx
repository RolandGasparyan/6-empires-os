'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PALETTE } from '@/lib/tokens';

interface HoloPanelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number; height?: number;
  label: string; value: string; accent?: string;
  floatSeed?: number;
}

export function HoloPanel({
  position = [0, 0, 0], rotation = [0, 0, 0],
  width = 2.4, height = 1.4, label, value,
  accent = PALETTE.gold, floatSeed = 0,
}: HoloPanelProps) {
  const grp = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (grp.current) grp.current.position.y = position[1] + Math.sin(s.clock.elapsedTime * 0.8 + floatSeed) * 0.06;
  });
  return (
    <group ref={grp} position={position} rotation={rotation}>
      <RoundedBox args={[width, height, 0.06]} radius={0.08} smoothness={6}>
        <meshPhysicalMaterial
          color={PALETTE.obsidian2} transparent opacity={0.82}
          transmission={0.35} roughness={0.18} metalness={0.4}
          clearcoat={1} clearcoatRoughness={0.1}
          emissive={accent} emissiveIntensity={0.04}
        />
      </RoundedBox>
      {/* gold frame edge */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, 0.06)]} />
        <lineBasicMaterial color={accent} transparent opacity={0.55} />
      </lineSegments>
      <Text position={[-width / 2 + 0.18, height / 2 - 0.28, 0.05]} fontSize={0.13} color="#9aa0ad" anchorX="left" letterSpacing={0.08}>
        {label.toUpperCase()}
      </Text>
      <Text position={[-width / 2 + 0.18, -0.05, 0.05]} fontSize={0.42} color={accent} anchorX="left" fontWeight={700}>
        {value}
      </Text>
    </group>
  );
}
