'use client';
/**
 * 6 EMPIRES — stylized character rig.
 * An appealing, rounded, expressive agent (NOT a generic sphere): tapered body,
 * soft head with animated blinking + wandering eyes, antenna, little arms, and a
 * gesture system (idle / type / wave / point / think / celebrate / scan). Driven
 * by a role so each department's agent has its own personality + motion.
 * Premium stylized — Pixar-ish silhouette in the limits of real-time R3F.
 */
import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

export type Gesture = 'idle' | 'type' | 'wave' | 'point' | 'think' | 'celebrate' | 'scan';

export interface CharacterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  accent?: string;
  scale?: number;
  gesture?: Gesture;
  name?: string;
  status?: string;
  bubble?: string;
  seed?: number;
}

export function Character({ position = [0, 0, 0], rotation = [0, 0, 0], color, accent = '#f4d98b', scale = 1, gesture = 'idle', name, status, bubble, seed = 0 }: CharacterProps) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const lEye = useRef<THREE.Mesh>(null);
  const rEye = useRef<THREE.Mesh>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const [blink, setBlink] = useState(1);

  // periodic blink
  useEffect(() => {
    let id: number;
    const loop = () => { setBlink(0.1); window.setTimeout(() => setBlink(1), 110); id = window.setTimeout(loop, 2200 + Math.random() * 2600); };
    id = window.setTimeout(loop, 1200 + Math.random() * 2000);
    return () => clearTimeout(id);
  }, []);

  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.08, emissive: new THREE.Color(color), emissiveIntensity: 0.06 }), [color]);

  useFrame((s) => {
    const t = s.clock.elapsedTime + seed;
    if (root.current) { root.current.position.y = position[1] + Math.sin(t * 1.5) * 0.02; root.current.rotation.y = rotation[1] + Math.sin(t * 0.5) * 0.06; }
    // eyes wander + blink
    const wx = Math.sin(t * 0.7) * 0.03, wy = Math.cos(t * 0.9) * 0.02;
    [lEye.current, rEye.current].forEach((e, i) => { if (e) { e.position.x = (i ? 0.1 : -0.1) + wx; e.position.y = 0.04 + wy; e.scale.y = blink; } });
    if (head.current) head.current.rotation.x = Math.sin(t * 0.6) * 0.05;

    // gesture-driven arm motion
    const L = lArm.current, R = rArm.current;
    if (L && R) {
      switch (gesture) {
        case 'type': R.rotation.x = -0.9 + Math.sin(t * 9) * 0.3; L.rotation.x = -0.9 + Math.cos(t * 9) * 0.3; break;
        case 'wave': R.rotation.z = -0.6 + Math.sin(t * 8) * 0.5; R.rotation.x = -1.3; L.rotation.x = 0.1; break;
        case 'point': R.rotation.x = -1.4; R.rotation.z = 0.2; L.rotation.x = 0.1; break;
        case 'think': R.rotation.x = -2.2; R.rotation.z = 0.5; if (head.current) head.current.rotation.z = 0.12; L.rotation.x = 0.1; break;
        case 'celebrate': { const u = -2.4 + Math.sin(t * 6) * 0.2; L.rotation.x = u; R.rotation.x = u; break; }
        case 'scan': if (head.current) head.current.rotation.y = Math.sin(t * 1.4) * 0.5; R.rotation.x = -0.5; L.rotation.x = -0.3; break;
        default: R.rotation.x = Math.sin(t * 1.5) * 0.12; L.rotation.x = Math.cos(t * 1.5) * 0.12;
      }
    }
  });

  return (
    <group ref={root} position={position} rotation={rotation} scale={scale}>
      {/* tapered body */}
      <mesh castShadow position={[0, 0.42, 0]}><cylinderGeometry args={[0.22, 0.32, 0.6, 20]} /><primitive object={skin} attach="material" /></mesh>
      {/* chest emblem */}
      <mesh position={[0, 0.5, 0.3]}><circleGeometry args={[0.07, 16]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} /></mesh>

      {/* head */}
      <group ref={head} position={[0, 0.92, 0]}>
        <mesh castShadow><sphereGeometry args={[0.32, 28, 22]} /><primitive object={skin} attach="material" /></mesh>
        {/* visor band */}
        <mesh position={[0, 0.05, 0.16]}><sphereGeometry args={[0.3, 24, 8, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.26]} /><meshStandardMaterial color="#0b0e12" roughness={0.2} metalness={0.4} emissive={accent} emissiveIntensity={0.08} /></mesh>
        {/* eyes (white, glossy) */}
        <mesh ref={lEye} position={[-0.1, 0.04, 0.28]}><sphereGeometry args={[0.055, 14, 14]} /><meshStandardMaterial color="#fff" roughness={0.1} /></mesh>
        <mesh ref={rEye} position={[0.1, 0.04, 0.28]}><sphereGeometry args={[0.055, 14, 14]} /><meshStandardMaterial color="#fff" roughness={0.1} /></mesh>
        <mesh position={[-0.1, 0.04, 0.33]}><sphereGeometry args={[0.022, 10, 10]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0.1, 0.04, 0.33]}><sphereGeometry args={[0.022, 10, 10]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        {/* cheeks */}
        <mesh position={[-0.18, -0.04, 0.26]}><circleGeometry args={[0.04, 12]} /><meshStandardMaterial color={accent} transparent opacity={0.35} /></mesh>
        <mesh position={[0.18, -0.04, 0.26]}><circleGeometry args={[0.04, 12]} /><meshStandardMaterial color={accent} transparent opacity={0.35} /></mesh>
        {/* antenna */}
        <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.012, 0.012, 0.14, 6]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[0, 0.43, 0]}><sphereGeometry args={[0.04, 12, 12]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} /></mesh>
      </group>

      {/* arms (shoulder-pivoted) */}
      <group ref={lArm} position={[-0.3, 0.6, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow><capsuleGeometry args={[0.05, 0.26, 4, 8]} /><primitive object={skin} attach="material" /></mesh>
        <mesh position={[0, -0.34, 0]}><sphereGeometry args={[0.07, 12, 12]} /><primitive object={skin} attach="material" /></mesh>
      </group>
      <group ref={rArm} position={[0.3, 0.6, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow><capsuleGeometry args={[0.05, 0.26, 4, 8]} /><primitive object={skin} attach="material" /></mesh>
        <mesh position={[0, -0.34, 0]}><sphereGeometry args={[0.07, 12, 12]} /><primitive object={skin} attach="material" /></mesh>
      </group>

      {/* little feet */}
      <mesh position={[-0.12, 0.06, 0.05]} castShadow><sphereGeometry args={[0.09, 12, 12]} /><primitive object={skin} attach="material" /></mesh>
      <mesh position={[0.12, 0.06, 0.05]} castShadow><sphereGeometry args={[0.09, 12, 12]} /><primitive object={skin} attach="material" /></mesh>

      {/* status ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.34, 0.4, 28]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.6} side={THREE.DoubleSide} /></mesh>

      {/* nameplate + status */}
      {name && (
        <Billboard position={[0, 1.6, 0]}>
          <Text fontSize={0.13} color={accent} anchorX="center" outlineWidth={0.004} outlineColor="#000">{name}</Text>
          {status && <Text position={[0, -0.15, 0]} fontSize={0.085} color={color} anchorX="center">● {status}</Text>}
        </Billboard>
      )}
      {/* speech bubble */}
      {bubble && (
        <Billboard position={[0.7, 1.45, 0]}>
          <mesh><planeGeometry args={[1.7, 0.38]} /><meshBasicMaterial color="#06070a" transparent opacity={0.82} /></mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.11} color="#f4d98b" anchorX="center" maxWidth={1.6}>{bubble}</Text>
        </Billboard>
      )}
    </group>
  );
}
