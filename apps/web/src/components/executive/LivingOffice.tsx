'use client';
/**
 * Living-office activity layer — makes every room feel ALIVE:
 *  • background NPC characters walking looping paths
 *  • a coffee-break cluster (two bots chatting by the bar)
 *  • notification badges that pop above the desk
 *  • occasional inter-agent chatter bubbles
 * Dropped into any DepartmentRoom via the `signature` slot.
 */
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Character } from './Character';

/** A walker that loops a path around the room perimeter. */
function Walker({ color, radius, speed, phase, y = 0 }: { color: string; radius: number; speed: number; phase: number; y?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    const a = s.clock.elapsedTime * speed + phase;
    if (g.current) {
      g.current.position.x = Math.cos(a) * radius;
      g.current.position.z = Math.sin(a) * radius * 0.7 + 1.5;
      g.current.rotation.y = -a + Math.PI / 2;
      g.current.position.y = y + Math.abs(Math.sin(a * 8)) * 0.04; // little walk bounce
    }
  });
  return <group ref={g}><Character color={color} scale={0.62} gesture="idle" /></group>;
}

/** Two bots chatting at the coffee bar, cycling small talk. */
function CoffeeCluster({ position, colors }: { position: [number, number, number]; colors: [string, string] }) {
  const [line, setLine] = useState(0);
  const chat = ['nice work ✦', 'shipping today', 'metrics up 📈', 'on it', 'good call'];
  useFrame((s) => setLine(Math.floor(s.clock.elapsedTime / 3) % chat.length));
  return (
    <group position={position}>
      {/* coffee bar */}
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.2, 1.0, 0.5]} /><meshStandardMaterial color="#1b1d24" metalness={0.4} roughness={0.5} /></mesh>
      <mesh position={[0, 1.02, 0]}><boxGeometry args={[1.24, 0.06, 0.54]} /><meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.25} /></mesh>
      <mesh position={[0.35, 1.18, 0]}><cylinderGeometry args={[0.08, 0.08, 0.28, 12]} /><meshStandardMaterial color="#23252d" /></mesh>
      <Character position={[-0.9, 0, 0.4]} rotation={[0, 0.7, 0]} color={colors[0]} scale={0.7} gesture="wave" />
      <Character position={[0.9, 0, 0.4]} rotation={[0, -0.7, 0]} color={colors[1]} scale={0.7} gesture="idle" bubble={chat[line]} />
    </group>
  );
}

/** Notification badges that float up and fade above a point. */
function Notifications({ position, accent }: { position: [number, number, number]; accent: string }) {
  const items = useRef<{ t: number; x: number }[]>([]);
  const grp = useRef<THREE.Group>(null);
  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => { items.current.push({ t: 0, x: (Math.random() - 0.5) * 0.6 }); if (items.current.length > 5) items.current.shift(); force((n) => n + 1); }, 2600); return () => clearInterval(id); }, []);
  useFrame((_, dt) => { items.current.forEach((it) => (it.t += dt)); if (grp.current) grp.current.children.forEach((c, i) => { const it = items.current[i]; if (it) { c.position.y = it.t * 0.5; (c as any).material && ((c as any).material.opacity = Math.max(0, 1 - it.t / 2.4)); } }); });
  return (
    <group ref={grp} position={position}>
      {items.current.map((it, i) => (
        <mesh key={i} position={[it.x, 0, 0]}><circleGeometry args={[0.06, 12]} /><meshBasicMaterial color={accent} transparent opacity={0.9} /></mesh>
      ))}
    </group>
  );
}

export function LivingOffice({ accent, walkerColors }: { accent: string; walkerColors: string[] }) {
  const walkers = useMemo(() => walkerColors.map((c, i) => ({ c, r: 4.2 + (i % 2) * 0.8, sp: 0.12 + i * 0.015, ph: i * 1.6 })), [walkerColors]);
  return (
    <group>
      {walkers.map((w, i) => <Walker key={i} color={w.c} radius={w.r} speed={w.sp} phase={w.ph} />)}
      <CoffeeCluster position={[3.4, 0, 3.4]} colors={[walkerColors[0] ?? '#3b82f6', walkerColors[1] ?? '#34f5a0']} />
      <Notifications position={[0, 2.1, -1.0]} accent={accent} />
    </group>
  );
}
