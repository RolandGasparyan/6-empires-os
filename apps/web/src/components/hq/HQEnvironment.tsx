'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const MARBLE = '#121013';
const GOLD = '#d4af50';

function FloorEmblem({ x, z, r, opacity }: { x: number; z: number; r: number; opacity: number; }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.z += dt * 0.05; });
  return (
    <mesh ref={ref} position={[x, 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[r, 0.04, 12, 80]} />
      <meshBasicMaterial color={GOLD} transparent opacity={opacity} />
    </mesh>
  );
}

function GoldDust({ count = 40 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 6 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      speeds[i] = 0.2 + Math.random() * 0.6;
    }
    return { positions, speeds };
  }, [count]);
  useFrame(() => {
    if (!ref.current) return;
    const p = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      p.array[i * 3 + 1] += 0.004 * speeds[i];
      if (p.array[i * 3 + 1] > 6.5) p.array[i * 3 + 1] = 0.5;
    }
    p.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={GOLD} transparent opacity={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function HQEnvironment() {
  return (
    <group>
      <ambientLight intensity={0.6} color="#6a5836" />
      <directionalLight position={[7, 14, 9]} intensity={1.0} color="#f6d987" />
      <pointLight position={[0, 9, 4]} intensity={34} distance={55} color={GOLD} />
      <pointLight position={[-9, 5, -7]} intensity={24} distance={45} color="#ffcf6b" />

      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[26, 0.4, 18]} />
        <meshPhysicalMaterial color={MARBLE} metalness={0.55} roughness={0.28} emissive="#141009" emissiveIntensity={0.12} clearcoat={0.6} />
      </mesh>

      <FloorEmblem x={-8} z={0} r={2.4} opacity={0.55} />
      <FloorEmblem x={-8} z={0} r={1.6} opacity={0.4} />
      <FloorEmblem x={7} z={0} r={2.0} opacity={0.4} />

      <mesh position={[-8, 3, -8.8]}>
        <planeGeometry args={[16, 6]} />
        <meshPhysicalMaterial color={MARBLE} metalness={0.55} roughness={0.28} emissive="#0c0a07" emissiveIntensity={0.14} />
      </mesh>
      <Text position={[-8, 3.4, -8.7]} fontSize={0.4} color={GOLD} anchorX="center" letterSpacing={0.1}>
        GLOBAL OPERATIONS
      </Text>
      <Text position={[6, 4.2, 2]} fontSize={0.5} color={GOLD} anchorX="center" letterSpacing={0.08}>
        AGENT FLOOR
      </Text>

      <GoldDust />
    </group>
  );
}
