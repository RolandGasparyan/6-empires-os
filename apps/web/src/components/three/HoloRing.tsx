'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '@/lib/tokens';

interface HoloRingProps {
  radius?: number; tube?: number; color?: string; speed?: number;
  rotation?: [number, number, number]; opacity?: number;
}

export function HoloRing({
  radius = 3, tube = 0.012, color = PALETTE.gold as string, speed = 0.2,
  rotation = [Math.PI / 2, 0, 0], opacity = 0.5,
}: HoloRingProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.z += dt * speed; });
  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, tube, 16, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}
