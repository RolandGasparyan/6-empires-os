'use client';
/**
 * A visible 3D agent worker at a luxury workstation.
 * Bot avatar (colored, idle-bobbing) + desk + triple monitors + status ring.
 * This is the "agents are physical entities" unit — placed throughout the world.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { PALETTE } from './Furniture';
import { useLiveStatus } from './liveContext';

export interface WorkerProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  name: string;
  status: string;
  seed?: number;
}

export function AgentWorker({ position = [0, 0, 0], rotation = [0, 0, 0], color, name, status: staticStatus, seed = 0 }: WorkerProps) {
  const bot = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const status = useLiveStatus(name, staticStatus); // real status from the live twin
  useFrame((s) => {
    const t = s.clock.elapsedTime + seed;
    if (bot.current) bot.current.position.y = 0.92 + Math.sin(t * 1.6) * 0.04;
    if (ring.current) ring.current.rotation.z = t * 0.6;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* desk */}
      <mesh position={[0, 0.74, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.08, 0.85]} />
        <meshStandardMaterial color={PALETTE.marbleLight} roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.70, -0.1]}><boxGeometry args={[1.72, 0.03, 0.87]} /><meshStandardMaterial color={PALETTE.gold} metalness={0.9} roughness={0.25} /></mesh>
      <mesh position={[-0.78, 0.37, -0.1]}><boxGeometry args={[0.07, 0.74, 0.7]} /><meshStandardMaterial color={PALETTE.charcoal} /></mesh>
      <mesh position={[0.78, 0.37, -0.1]}><boxGeometry args={[0.07, 0.74, 0.7]} /><meshStandardMaterial color={PALETTE.charcoal} /></mesh>

      {/* triple curved monitors */}
      {[-0.62, 0, 0.62].map((x, i) => (
        <mesh key={i} position={[x, 1.12, -0.36]} rotation={[0, -x * 0.5, 0]} castShadow>
          <boxGeometry args={[0.58, 0.36, 0.03]} />
          <meshStandardMaterial color="#06100b" emissive={color} emissiveIntensity={0.35} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.92, -0.36]}><boxGeometry args={[0.12, 0.22, 0.1]} /><meshStandardMaterial color={PALETTE.charcoal} /></mesh>

      {/* office chair */}
      <group position={[0, 0, 0.6]}>
        <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.5, 0.12, 0.5]} /><meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} /></mesh>
        <mesh position={[0, 0.78, -0.22]} castShadow><boxGeometry args={[0.5, 0.5, 0.12]} /><meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} /></mesh>
        <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.04, 0.04, 0.45, 8]} /><meshStandardMaterial color={PALETTE.gold} metalness={0.7} roughness={0.3} /></mesh>
      </group>

      {/* the agent bot */}
      <group ref={bot} position={[0, 0.92, 0.25]}>
        <mesh castShadow><sphereGeometry args={[0.26, 20, 16]} /><meshStandardMaterial color={color} roughness={0.4} metalness={0.1} emissive={color} emissiveIntensity={0.12} /></mesh>
        <mesh position={[0, -0.2, 0]} castShadow><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
        {/* eyes */}
        <mesh position={[-0.09, 0.03, 0.22]}><sphereGeometry args={[0.05, 10, 10]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0.09, 0.03, 0.22]}><sphereGeometry args={[0.05, 10, 10]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[-0.075, 0.05, 0.255]}><sphereGeometry args={[0.016, 8, 8]} /><meshStandardMaterial color="#fff" /></mesh>
        <mesh position={[0.105, 0.05, 0.255]}><sphereGeometry args={[0.016, 8, 8]} /><meshStandardMaterial color="#fff" /></mesh>
        {/* antenna */}
        <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.012, 0.012, 0.16, 6]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[0, 0.42, 0]}><sphereGeometry args={[0.04, 10, 10]} /><meshStandardMaterial color={PALETTE.gold} emissive={PALETTE.gold} emissiveIntensity={0.6} /></mesh>
      </group>

      {/* status ring under the bot */}
      <mesh ref={ring} position={[0, 0.02, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.4, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* floating nameplate + status */}
      <Billboard position={[0, 1.85, 0.25]}>
        <Text fontSize={0.16} color={PALETTE.gold} anchorX="center" outlineWidth={0.004} outlineColor="#000">{name}</Text>
        <Text position={[0, -0.18, 0]} fontSize={0.1} color={color} anchorX="center">{status}</Text>
      </Billboard>
    </group>
  );
}
