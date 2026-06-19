'use client';
/**
 * Rich interior detail kit for the connected world — turns minimal rooms into
 * Sims-level furnished departments: multi-monitor workstations, ergonomic
 * chairs, desk lamps, plants, wall art, rugs, shelving, animated screens.
 * Every piece is low-poly primitive-built (no assets) for real-time R3F.
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { BASE } from './roomKit';

/* ---- animated wall screen (charts / code / ui) ---- */
export function WallScreen({ position, rotation = [0, 0, 0], w = 1.6, h = 0.95, accent, kind = 'chart' }:
  { position: [number, number, number]; rotation?: [number, number, number]; w?: number; h?: number; accent: string; kind?: 'chart' | 'code' | 'ui' | 'grid' }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((s) => { if (mat.current) mat.current.emissiveIntensity = 0.55 + Math.sin(s.clock.elapsedTime * 2.4) * 0.1; });
  const line = useMemo(() => new THREE.BufferGeometry().setFromPoints(Array.from({ length: 22 }, (_, i) => new THREE.Vector3((i / 21 - 0.5) * w * 0.82, (Math.sin(i * 0.7) * 0.12 + (i / 21) * 0.18 - 0.09) * h, 0.03))), [w, h]);
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w + 0.08, h + 0.08, 0.05]} radius={0.02}><meshStandardMaterial color="#15171d" metalness={0.6} roughness={0.4} /></RoundedBox>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[w, h]} /><meshStandardMaterial ref={mat} color="#05080a" emissive={accent} emissiveIntensity={0.55} /></mesh>
      {kind === 'chart' && <primitive object={new THREE.Line(line, new THREE.LineBasicMaterial({ color: accent }))} />}
      {kind === 'code' && Array.from({ length: 9 }).map((_, i) => <CodeRow key={i} y={h * 0.4 - i * (h * 0.09)} w={w} accent={accent} seed={i} />)}
      {(kind === 'grid' || kind === 'ui') && <gridHelper args={[w, 8, accent, accent]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]} />}
    </group>
  );
}
function CodeRow({ y, w, accent, seed }: { y: number; w: number; accent: string; seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) { const l = 0.25 + Math.abs(Math.sin(s.clock.elapsedTime * 0.9 + seed)) * 0.6; ref.current.scale.x = l; ref.current.position.x = -w * 0.38 + (l * w * 0.66) / 2; } });
  return <mesh ref={ref} position={[-w * 0.3, y, 0.04]}><planeGeometry args={[w * 0.66, 0.03]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} /></mesh>;
}

/* ---- ergonomic office chair ---- */
export function Chair({ position, rotation = [0, 0, 0], color = '#1b1d24' }: { position: [number, number, number]; rotation?: [number, number, number]; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.5, 0.1, 0.5]} radius={0.04} position={[0, 0.5, 0]} castShadow><meshStandardMaterial color={color} roughness={0.7} /></RoundedBox>
      <RoundedBox args={[0.5, 0.55, 0.1]} radius={0.05} position={[0, 0.8, -0.22]} castShadow><meshStandardMaterial color={color} roughness={0.7} /></RoundedBox>
      <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.04, 0.04, 0.42, 8]} /><meshStandardMaterial color="#0c0d10" metalness={0.6} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.25) * 0.22, 0.06, Math.sin(i * 1.25) * 0.22]}><boxGeometry args={[0.16, 0.04, 0.05]} /><meshStandardMaterial color="#0c0d10" /></mesh>)}
    </group>
  );
}

/* ---- desk lamp (glowing) ---- */
export function Lamp({ position, accent = BASE.goldHi }: { position: [number, number, number]; accent?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.08, 0.1, 0.04, 12]} /><meshStandardMaterial color="#0c0d10" metalness={0.5} /></mesh>
      <mesh position={[0, 0.18, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.012, 0.012, 0.32, 6]} /><meshStandardMaterial color="#23252d" /></mesh>
      <mesh position={[0.08, 0.34, 0]} rotation={[0, 0, -0.6]}><coneGeometry args={[0.06, 0.12, 12, 1, true]} /><meshStandardMaterial color="#2a2c33" side={THREE.DoubleSide} /></mesh>
      <pointLight position={[0.08, 0.3, 0]} intensity={0.25} color={accent} distance={2.2} />
    </group>
  );
}

/* ---- potted plant (varied) ---- */
export function Pot({ position, big = false }: { position: [number, number, number]; big?: boolean }) {
  const h = big ? 1.3 : 0.7;
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]} castShadow><cylinderGeometry args={[0.16, 0.2, 0.36, 12]} /><meshStandardMaterial color="#2a2c33" roughness={0.7} /></mesh>
      <mesh position={[0, 0.37, 0]}><cylinderGeometry args={[0.17, 0.17, 0.03, 12]} /><meshStandardMaterial color={BASE.gold} metalness={0.8} roughness={0.3} /></mesh>
      {Array.from({ length: 7 }).map((_, i) => <mesh key={i} position={[Math.cos(i) * 0.1, 0.4 + h * 0.5, Math.sin(i) * 0.1]} rotation={[Math.cos(i) * 0.4, i, Math.sin(i) * 0.4]} castShadow><coneGeometry args={[0.12, h, 5]} /><meshStandardMaterial color={i % 2 ? '#3f7a4e' : '#2c5a38'} roughness={1} /></mesh>)}
    </group>
  );
}

/* ---- framed wall art ---- */
export function Art({ position, rotation = [0, 0, 0], accent }: { position: [number, number, number]; rotation?: [number, number, number]; accent: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh><boxGeometry args={[0.8, 1.0, 0.04]} /><meshStandardMaterial color={BASE.gold} metalness={0.7} roughness={0.4} /></mesh>
      <mesh position={[0, 0, 0.025]}><planeGeometry args={[0.68, 0.88]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.15} roughness={0.9} /></mesh>
    </group>
  );
}

/* ---- shelving with books/awards ---- */
export function Shelf({ position, rotation = [0, 0, 0], accent }: { position: [number, number, number]; rotation?: [number, number, number]; accent: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh><boxGeometry args={[1.4, 1.8, 0.3]} /><meshStandardMaterial color="#15161b" roughness={0.6} /></mesh>
      {[-0.5, 0, 0.5].map((y) => <mesh key={y} position={[0, y, 0.16]}><boxGeometry args={[1.35, 0.03, 0.02]} /><meshStandardMaterial color={BASE.gold} metalness={0.7} roughness={0.4} /></mesh>)}
      {Array.from({ length: 10 }).map((_, i) => <mesh key={i} position={[-0.55 + (i % 5) * 0.27, (i < 5 ? 0.2 : -0.3), 0.18]}><boxGeometry args={[0.06, 0.34, 0.18]} /><meshStandardMaterial color={[accent, BASE.gold, '#7a2e2e', '#27405e', '#2c5a38'][i % 5]} roughness={0.6} /></mesh>)}
    </group>
  );
}

/* ---- trophy shelving (gold awards in lit niches — reference signature) ---- */
export function TrophyShelf({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh><boxGeometry args={[2.2, 2.4, 0.3]} /><meshStandardMaterial color="#140f0a" roughness={0.5} metalness={0.2} /></mesh>
      {[-0.7, 0, 0.7].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0.16]}><boxGeometry args={[2.1, 0.04, 0.02]} /><meshStandardMaterial color={BASE.gold} metalness={0.8} roughness={0.3} emissive={BASE.gold} emissiveIntensity={0.3} /></mesh>
          {/* warm niche light */}
          <pointLight position={[0, y + 0.18, 0.3]} intensity={0.18} color={BASE.goldHi} distance={1.6} />
          {[-0.7, 0, 0.7].map((x) => (
            <group key={x} position={[x, y + 0.2, 0.18]}>
              {/* trophy: cup on a base */}
              <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.12, 0.05, 0.1]} /><meshStandardMaterial color={BASE.goldDeep} metalness={0.9} roughness={0.25} /></mesh>
              <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.07, 0.03, 0.16, 12]} /><meshStandardMaterial color={BASE.gold} metalness={0.95} roughness={0.2} emissive={BASE.gold} emissiveIntensity={0.25} /></mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ---- leather lounge sofa with gold cushions (reference) ---- */
export function Lounge({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[2.6, 0.4, 0.95]} radius={0.1} position={[0, 0.32, 0]} castShadow><meshStandardMaterial color="#0e0b08" roughness={0.6} metalness={0.1} /></RoundedBox>
      <RoundedBox args={[2.6, 0.5, 0.25]} radius={0.08} position={[0, 0.62, -0.35]} castShadow><meshStandardMaterial color="#0e0b08" roughness={0.6} /></RoundedBox>
      {/* gold cushions */}
      {[-0.8, 0.8].map((x) => <RoundedBox key={x} args={[0.5, 0.18, 0.5]} radius={0.06} position={[x, 0.5, 0.05]}><meshStandardMaterial color={BASE.gold} roughness={0.5} metalness={0.3} emissive={BASE.gold} emissiveIntensity={0.1} /></RoundedBox>)}
      {/* gold feet */}
      {[[-1.2, -0.4], [1.2, -0.4], [-1.2, 0.4], [1.2, 0.4]].map(([x, z], i) => <mesh key={i} position={[x, 0.06, z]}><boxGeometry args={[0.06, 0.12, 0.06]} /><meshStandardMaterial color={BASE.gold} metalness={0.9} roughness={0.3} /></mesh>)}
    </group>
  );
}

/* ---- rug ---- */
export function Rug({ position, accent, size = 3 }: { position: [number, number, number]; accent: string; size?: number }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[size, size * 0.7]} /><meshStandardMaterial color="#15161b" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}><ringGeometry args={[size * 0.28, size * 0.32, 40]} /><meshStandardMaterial color={accent} metalness={0.3} roughness={0.6} emissive={accent} emissiveIntensity={0.1} /></mesh>
    </group>
  );
}

/* ---- a full multi-monitor workstation (desk + 3 screens + chair + lamp) ---- */
export function Workstation({ position, rotation = [0, 0, 0], color, kind = 'code' }:
  { position: [number, number, number]; rotation?: [number, number, number]; color: string; kind?: 'chart' | 'code' | 'ui' | 'grid' }) {
  return (
    <group position={position} rotation={rotation}>
      {/* desk top + gold edge */}
      <RoundedBox args={[1.9, 0.1, 0.95]} radius={0.04} position={[0, 0.75, 0]} castShadow receiveShadow><meshStandardMaterial color="#16181e" metalness={0.4} roughness={0.4} /></RoundedBox>
      <mesh position={[0, 0.69, 0]}><boxGeometry args={[1.92, 0.03, 0.97]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.35} emissive={color} emissiveIntensity={0.18} /></mesh>
      {/* legs */}
      <mesh position={[-0.9, 0.37, 0]}><boxGeometry args={[0.08, 0.74, 0.8]} /><meshStandardMaterial color="#0c0d10" /></mesh>
      <mesh position={[0.9, 0.37, 0]}><boxGeometry args={[0.08, 0.74, 0.8]} /><meshStandardMaterial color="#0c0d10" /></mesh>
      {/* triple monitors on stands */}
      {[-0.62, 0, 0.62].map((x, i) => (
        <group key={i} position={[x, 0, -0.28]} rotation={[0, -x * 0.45, 0]}>
          <mesh position={[0, 1.12, 0]} castShadow><boxGeometry args={[0.56, 0.34, 0.03]} /><meshStandardMaterial color="#05080a" emissive={color} emissiveIntensity={0.4} roughness={0.25} /></mesh>
          <mesh position={[0, 0.9, 0]}><boxGeometry args={[0.06, 0.12, 0.06]} /><meshStandardMaterial color="#0c0d10" /></mesh>
          <mesh position={[0, 0.83, 0]}><boxGeometry args={[0.18, 0.02, 0.12]} /><meshStandardMaterial color="#0c0d10" /></mesh>
        </group>
      ))}
      {/* keyboard + mouse + mug */}
      <mesh position={[0, 0.81, 0.22]}><boxGeometry args={[0.5, 0.02, 0.16]} /><meshStandardMaterial color="#0c0d10" /></mesh>
      <mesh position={[0.38, 0.81, 0.22]}><boxGeometry args={[0.07, 0.02, 0.11]} /><meshStandardMaterial color="#0c0d10" /></mesh>
      <mesh position={[-0.7, 0.84, 0.18]}><cylinderGeometry args={[0.05, 0.05, 0.1, 12]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>
      <Lamp position={[0.78, 0.8, 0.2]} accent={color} />
      <Chair position={[0, 0, 0.78]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}
