'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props { color: string; seed?: number; emissive?: number; }

/** Stylized robot avatar that breathes, turns its head, and types. */
export function AgentAvatar({ color, seed = 0, emissive = 0.38 }: Props) {
  const body = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime * 1.4 + seed;
    if (body.current) body.current.position.y = 0.95 + Math.sin(t) * 0.015;
    if (head.current) head.current.rotation.y = Math.sin(t * 0.5) * 0.28;
    if (armL.current) armL.current.rotation.x = 0.9 + Math.sin(t * 3) * 0.18;
    if (armR.current) armR.current.rotation.x = 0.9 + Math.cos(t * 3 + 1) * 0.18;
  });
  return (
    <group>
      <mesh ref={body} position={[0, 0.95, 0]} scale={[1, 1.18, 1]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.22} emissive={color} emissiveIntensity={emissive} clearcoat={1} />
      </mesh>
      <group ref={head} position={[0, 1.42, 0]}>
        <mesh>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshPhysicalMaterial color="#f2f2f2" metalness={0.3} roughness={0.2} emissive={color} emissiveIntensity={0.12} clearcoat={1} />
        </mesh>
        <mesh rotation={[Math.PI * 0.62, 0, 0]}>
          <sphereGeometry args={[0.205, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshBasicMaterial color="#08120d" />
        </mesh>
        {[-0.07, 0.07].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.17]}>
            <sphereGeometry args={[0.027, 10, 10]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </group>
      <mesh ref={armL} position={[-0.26, 0.95, 0.12]} rotation={[0.9, 0, -0.3]}>
        <cylinderGeometry args={[0.05, 0.05, 0.34, 8]} />
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.3} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      <mesh ref={armR} position={[0.26, 0.95, 0.12]} rotation={[0.9, 0, 0.3]}>
        <cylinderGeometry args={[0.05, 0.05, 0.34, 8]} />
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.3} emissive={color} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}
