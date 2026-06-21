'use client';
/**
 * 6 EMPIRES — stylized HUMAN character rig (Simpsons-style language).
 * Yellow skin, sculpted hair + optional beard, business suit with collar + tie
 * (bow-tie for the CEO), gold watch/lapel pin. Expressive blinking eyes, idle
 * sway + role gestures. Built from primitives (no external .glb) — a premium
 * stylized humanoid that matches the reference character language in real-time.
 *
 * Honest scope: this is a code-built stylized human, not a film-render. It
 * captures the look (yellow skin, hair, suit, proportions) far better than the
 * bot avatars, in the limits of procedural R3F.
 */
import { useRef, useMemo, useEffect } from 'react';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Gesture } from './Character';

const SKIN = '#f5c518';      // signature yellow
const SKIN_SH = '#d9a800';

export interface HumanProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  suit: string;              // outfit accent (identity color)
  hair?: string;             // hair/beard color
  beard?: boolean;
  glasses?: boolean;
  bowtie?: boolean;          // CEO / formal
  gesture?: Gesture;
  name?: string;
  status?: string;
  seed?: number;
}

export function HumanCharacter({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, suit, hair = '#1a1410', beard = false, glasses = false, bowtie = false, gesture = 'idle', name, status, seed = 0 }: HumanProps) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const lEye = useRef<THREE.Mesh>(null);
  const rEye = useRef<THREE.Mesh>(null);
  const blink = 1;

  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.55, metalness: 0.02 }), []);
  const skinSh = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN_SH, roughness: 0.6 }), []);
  const cloth = useMemo(() => new THREE.MeshStandardMaterial({ color: suit, roughness: 0.7, metalness: 0.06 }), [suit]);
  const hairM = useMemo(() => new THREE.MeshStandardMaterial({ color: hair, roughness: 0.5 }), [hair]);

  // STATIC pose set once (no per-frame animation) — keeps the world simple + fast.
  useEffect(() => {
    const L = lArm.current, R = rArm.current;
    if (L && R) {
      switch (gesture) {
        case 'type': R.rotation.x = -1.1; L.rotation.x = -1.1; break;
        case 'wave': R.rotation.z = -0.2; R.rotation.x = -1.6; break;
        case 'point': R.rotation.x = -1.2; R.rotation.z = 0.15; break;
        case 'think': R.rotation.x = -1.9; R.rotation.z = 0.4; if (head.current) head.current.rotation.z = 0.1; break;
        case 'scan': R.rotation.x = -0.4; break;
        default: break;
      }
    }
  }, [gesture]);

  return (
    <group ref={root} position={position} rotation={rotation} scale={scale}>
      {/* legs */}
      <mesh position={[-0.12, 0.32, 0]} castShadow><capsuleGeometry args={[0.1, 0.5, 4, 10]} /><primitive object={cloth} attach="material" /></mesh>
      <mesh position={[0.12, 0.32, 0]} castShadow><capsuleGeometry args={[0.1, 0.5, 4, 10]} /><primitive object={cloth} attach="material" /></mesh>
      {/* shoes */}
      <mesh position={[-0.12, 0.05, 0.07]}><boxGeometry args={[0.14, 0.08, 0.24]} /><meshStandardMaterial color="#0a0806" roughness={0.4} /></mesh>
      <mesh position={[0.12, 0.05, 0.07]}><boxGeometry args={[0.14, 0.08, 0.24]} /><meshStandardMaterial color="#0a0806" roughness={0.4} /></mesh>

      {/* torso — suit jacket */}
      <mesh position={[0, 0.85, 0]} castShadow><capsuleGeometry args={[0.26, 0.5, 6, 14]} /><primitive object={cloth} attach="material" /></mesh>
      {/* white shirt V + tie/bowtie */}
      <mesh position={[0, 0.92, 0.2]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.12, 0.4, 3]} /><meshStandardMaterial color="#efe9dc" roughness={0.6} /></mesh>
      {bowtie
        ? <mesh position={[0, 1.04, 0.24]}><boxGeometry args={[0.14, 0.05, 0.03]} /><meshStandardMaterial color="#0a0806" /></mesh>
        : <mesh position={[0, 0.92, 0.24]}><boxGeometry args={[0.05, 0.28, 0.02]} /><meshStandardMaterial color={suit} roughness={0.5} /></mesh>}
      {/* gold lapel pin */}
      <mesh position={[0.14, 1.0, 0.24]}><sphereGeometry args={[0.022, 8, 8]} /><meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} emissive="#d4af37" emissiveIntensity={0.3} /></mesh>

      {/* arms (shoulder pivot) */}
      <group ref={lArm} position={[-0.3, 1.05, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow><capsuleGeometry args={[0.08, 0.36, 4, 10]} /><primitive object={cloth} attach="material" /></mesh>
        <mesh position={[0, -0.44, 0]}><sphereGeometry args={[0.075, 12, 12]} /><primitive object={skin} attach="material" /></mesh>
      </group>
      <group ref={rArm} position={[0.3, 1.05, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow><capsuleGeometry args={[0.08, 0.36, 4, 10]} /><primitive object={cloth} attach="material" /></mesh>
        <mesh position={[0, -0.44, 0]}><sphereGeometry args={[0.075, 12, 12]} /><primitive object={skin} attach="material" /></mesh>
        {/* gold watch */}
        <mesh position={[0, -0.34, 0]}><torusGeometry args={[0.085, 0.018, 6, 16]} /><meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} /></mesh>
      </group>

      {/* neck + head */}
      <mesh position={[0, 1.18, 0]}><cylinderGeometry args={[0.07, 0.08, 0.1, 10]} /><primitive object={skinSh} attach="material" /></mesh>
      <group ref={head} position={[0, 1.34, 0]}>
        <mesh castShadow><sphereGeometry args={[0.26, 28, 24]} /><primitive object={skin} attach="material" /></mesh>
        {/* hair (swept top + back) */}
        <mesh position={[0, 0.12, -0.02]} scale={[1.08, 0.8, 1.12]}><sphereGeometry args={[0.25, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} /><primitive object={hairM} attach="material" /></mesh>
        <mesh position={[0.16, 0.16, 0.05]} rotation={[0, 0, -0.5]}><coneGeometry args={[0.08, 0.16, 8]} /><primitive object={hairM} attach="material" /></mesh>
        {/* beard */}
        {beard && <mesh position={[0, -0.12, 0.16]} scale={[1, 0.9, 0.7]}><sphereGeometry args={[0.2, 18, 14, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45]} /><primitive object={hairM} attach="material" /></mesh>}
        {/* eyes (big, Simpsons-style) */}
        <mesh ref={lEye} position={[-0.09, 0.03, 0.22]}><sphereGeometry args={[0.066, 16, 16]} /><meshStandardMaterial color="#fff" roughness={0.1} /></mesh>
        <mesh ref={rEye} position={[0.09, 0.03, 0.22]}><sphereGeometry args={[0.066, 16, 16]} /><meshStandardMaterial color="#fff" roughness={0.1} /></mesh>
        <mesh position={[-0.09, 0.03, 0.27]}><sphereGeometry args={[0.024, 10, 10]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0.09, 0.03, 0.27]}><sphereGeometry args={[0.024, 10, 10]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        {/* brows */}
        <mesh position={[-0.09, 0.11, 0.24]} rotation={[0, 0, 0.1]}><boxGeometry args={[0.08, 0.018, 0.02]} /><primitive object={hairM} attach="material" /></mesh>
        <mesh position={[0.09, 0.11, 0.24]} rotation={[0, 0, -0.1]}><boxGeometry args={[0.08, 0.018, 0.02]} /><primitive object={hairM} attach="material" /></mesh>
        {/* nose */}
        <mesh position={[0, -0.02, 0.27]}><sphereGeometry args={[0.04, 10, 10]} /><primitive object={skinSh} attach="material" /></mesh>
        {/* glasses */}
        {glasses && <group position={[0, 0.03, 0.26]}>
          <mesh position={[-0.09, 0, 0]}><torusGeometry args={[0.07, 0.012, 6, 16]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
          <mesh position={[0.09, 0, 0]}><torusGeometry args={[0.07, 0.012, 6, 16]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
          <mesh position={[0, 0, 0]}><boxGeometry args={[0.05, 0.012, 0.012]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        </group>}
      </group>

      {/* nameplate */}
      {name && (
        <Billboard position={[0, 1.95, 0]}>
          <Text fontSize={0.13} color="#f4d98b" anchorX="center" outlineWidth={0.004} outlineColor="#000">{name}</Text>
          {status && <Text position={[0, -0.15, 0]} fontSize={0.085} color={suit} anchorX="center">● {status}</Text>}
        </Billboard>
      )}
      {/* status ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.3, 0.36, 28]} /><meshStandardMaterial color={suit} emissive={suit} emissiveIntensity={0.5} transparent opacity={0.5} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}
