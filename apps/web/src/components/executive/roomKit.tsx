'use client';
/**
 * Reusable showcase-room KIT — the shared building blocks extracted from the
 * Executive Command Center so every department can be built to the same bar.
 * A department is just a DeptConfig (palette + accents + screens + agent +
 * signature props) fed to <DepartmentRoom>.
 */
import { useRef, useState, useMemo, ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, Float, Text, Billboard, RoundedBox, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const BASE = { marble: '#0e0f13', marbleHi: '#1b1d24', gold: '#d4af37', goldHi: '#f4d98b', white: '#e8e6df', glass: '#bcdce8', ink: '#06070a', charcoal: '#23252d' };

export interface DeptConfig {
  id: string;
  title: string;
  subtitle: string;
  primary: string;     // main accent (room identity color)
  secondary: string;   // secondary accent
  agentColor: string;
  agentName: string;
  agentStatus: string;
  bubbles: string[];
  screens: { kind: 'chart' | 'bars' | 'map' | 'code' | 'grid'; accent: 'primary' | 'secondary' | 'gold' | 'green' }[];
  inspect: Record<string, { title: string; accent: string; body: string; lines: [string, string][] }>;
}

const accentOf = (c: DeptConfig, k: string) => k === 'primary' ? c.primary : k === 'secondary' ? c.secondary : k === 'gold' ? BASE.gold : '#34f5a0';

/* ---------- inspectable wrapper ---------- */
export function Inspect({ id, onPick, children }: { id: string; onPick: (id: string) => void; children: ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <group onClick={(e) => { e.stopPropagation(); onPick(id); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'auto'; }}>
      {children}
      {h && <pointLight position={[0, 1.5, 0]} intensity={0.4} color={BASE.goldHi} distance={3} />}
    </group>
  );
}

/* ---------- animated screen ---------- */
function AnimBar({ x, w, maxH, accent, seed }: { x: number; w: number; maxH: number; accent: string; seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) { const hh = (0.4 + Math.abs(Math.sin(s.clock.elapsedTime * 1.2 + seed)) * 0.6) * maxH; ref.current.scale.y = hh; ref.current.position.y = hh / 2 - maxH / 2; } });
  return <mesh ref={ref} position={[x, 0, 0.03]}><boxGeometry args={[w, 1, 0.01]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} /></mesh>;
}
export function Screen({ position, rotation = [0, 0, 0], w = 1.6, h = 0.9, accent = '#34f5a0', kind = 'chart' }:
  { position: [number, number, number]; rotation?: [number, number, number]; w?: number; h?: number; accent?: string; kind?: string }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((s) => { if (mat.current) mat.current.emissiveIntensity = 0.5 + Math.sin(s.clock.elapsedTime * 2) * 0.08; });
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(Array.from({ length: 24 }, (_, i) => new THREE.Vector3((i / 23 - 0.5) * w * 0.86, (Math.sin(i * 0.6) * 0.12 + (i / 23) * 0.2 - 0.1) * h, 0.02))), [w, h]);
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w + 0.06, h + 0.06, 0.04]} radius={0.02}><meshStandardMaterial color={BASE.charcoal} metalness={0.6} roughness={0.4} /></RoundedBox>
      <mesh position={[0, 0, 0.025]}><planeGeometry args={[w, h]} /><meshStandardMaterial ref={mat} color={BASE.ink} emissive={accent} emissiveIntensity={0.5} /></mesh>
      {(kind === 'chart') && <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: accent }))} />}
      {kind === 'bars' && Array.from({ length: 9 }).map((_, i) => <AnimBar key={i} x={(i / 8 - 0.5) * w * 0.8} w={w * 0.06} maxH={h * 0.7} accent={accent} seed={i} />)}
      {(kind === 'map' || kind === 'grid') && <gridHelper args={[w, 10, accent, accent]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.03]} />}
      {kind === 'code' && Array.from({ length: 8 }).map((_, i) => <CodeLine key={i} y={h * 0.4 - i * (h * 0.1)} w={w} accent={accent} seed={i} />)}
    </group>
  );
}
function CodeLine({ y, w, accent, seed }: { y: number; w: number; accent: string; seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) { const len = (0.3 + Math.abs(Math.sin(s.clock.elapsedTime * 0.8 + seed)) * 0.6); ref.current.scale.x = len; ref.current.position.x = -w * 0.4 + (len * w * 0.7) / 2; } });
  return <mesh ref={ref} position={[-w * 0.3, y, 0.03]}><planeGeometry args={[w * 0.7, h6]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} /></mesh>;
}
const h6 = 0.035;

/* ---------- rotating hologram ---------- */
export function Hologram({ position, primary, secondary }: { position: [number, number, number]; primary: string; secondary: string }) {
  const grp = useRef<THREE.Group>(null);
  useFrame((s, dt) => { if (grp.current) grp.current.rotation.y += dt * 0.18; });
  return (
    <group position={position}>
      <mesh position={[0, -0.02, 0]}><cylinderGeometry args={[0.7, 0.78, 0.05, 32]} /><meshStandardMaterial color={BASE.charcoal} metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.72, 0.72, 0.02, 32]} /><meshStandardMaterial color={BASE.gold} emissive={BASE.gold} emissiveIntensity={0.6} /></mesh>
      <group ref={grp} position={[0, 0.6, 0]}>
        <mesh><sphereGeometry args={[0.5, 24, 24]} /><meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.3} transparent opacity={0.18} wireframe /></mesh>
        <mesh><sphereGeometry args={[0.49, 18, 18]} /><meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.25} transparent opacity={0.12} /></mesh>
        {Array.from({ length: 14 }).map((_, i) => { const a = i * 0.9, b = i * 0.45; return <mesh key={i} position={[Math.cos(a) * Math.cos(b) * 0.5, Math.sin(b) * 0.5, Math.sin(a) * Math.cos(b) * 0.5]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color={BASE.goldHi} emissive={BASE.goldHi} emissiveIntensity={1} /></mesh>; })}
      </group>
      <mesh position={[0, 0.32, 0]}><coneGeometry args={[0.62, 0.7, 24, 1, true]} /><meshBasicMaterial color={primary} transparent opacity={0.04} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

/* ---------- particles ---------- */
export function Particles({ count = 110, color = BASE.goldHi }: { count?: number; color?: string }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => { const p = new Float32Array(count * 3); for (let i = 0; i < count; i++) { p[i * 3] = (Math.random() - 0.5) * 16; p[i * 3 + 1] = Math.random() * 6; p[i * 3 + 2] = (Math.random() - 0.5) * 16; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g; }, [count]);
  useFrame((s) => { if (ref.current) { ref.current.rotation.y = s.clock.elapsedTime * 0.02; const pos = ref.current.geometry.attributes.position; for (let i = 0; i < count; i++) { pos.array[i * 3 + 1] += 0.002; if (pos.array[i * 3 + 1] > 6) pos.array[i * 3 + 1] = 0; } pos.needsUpdate = true; } });
  return <points ref={ref} geometry={geo}><pointsMaterial size={0.02} color={color} transparent opacity={0.5} sizeAttenuation /></points>;
}

/* ---------- working agent ---------- */
export function Agent({ color, name, status, bubbles, onPick }: { color: string; name: string; status: string; bubbles: string[]; onPick: (id: string) => void }) {
  const body = useRef<THREE.Group>(null); const arm = useRef<THREE.Group>(null); const [b, setB] = useState(0);
  useFrame((s) => { const t = s.clock.elapsedTime; if (body.current) { body.current.position.y = 1.0 + Math.sin(t * 1.4) * 0.025; body.current.rotation.y = Math.sin(t * 0.5) * 0.12; } if (arm.current) arm.current.rotation.x = -0.5 + Math.sin(t * 6) * 0.25; setB(Math.floor(t / 4) % Math.max(1, bubbles.length)); });
  return (
    <group position={[0, 0, -1.4]}>
      <Inspect id="agent" onPick={onPick}>
        <group ref={body} position={[0, 1.0, 0]}>
          <mesh castShadow><sphereGeometry args={[0.3, 24, 18]} /><meshStandardMaterial color={color} roughness={0.4} metalness={0.12} emissive={color} emissiveIntensity={0.1} /></mesh>
          <mesh position={[0, -0.26, 0]} castShadow><sphereGeometry args={[0.24, 18, 14]} /><meshStandardMaterial color={color} roughness={0.45} /></mesh>
          <mesh position={[-0.1, 0.04, 0.26]}><sphereGeometry args={[0.055, 12, 12]} /><meshStandardMaterial color={BASE.ink} /></mesh>
          <mesh position={[0.1, 0.04, 0.26]}><sphereGeometry args={[0.055, 12, 12]} /><meshStandardMaterial color={BASE.ink} /></mesh>
          <mesh position={[-0.085, 0.06, 0.3]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#fff" /></mesh>
          <mesh position={[0.115, 0.06, 0.3]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#fff" /></mesh>
          <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.012, 0.012, 0.16, 6]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, 0.42, 0]}><sphereGeometry args={[0.04, 10, 10]} /><meshStandardMaterial color={BASE.gold} emissive={BASE.gold} emissiveIntensity={0.6} /></mesh>
          <group ref={arm} position={[0.18, -0.2, 0.18]}><mesh><capsuleGeometry args={[0.04, 0.2, 4, 8]} /><meshStandardMaterial color={color} /></mesh></group>
        </group>
      </Inspect>
      <Billboard position={[0.7, 1.7, 0]}>
        <mesh><planeGeometry args={[1.7, 0.4]} /><meshBasicMaterial color={BASE.ink} transparent opacity={0.82} /></mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.12} color={BASE.goldHi} anchorX="center" maxWidth={1.6}>{bubbles[b] ?? ''}</Text>
      </Billboard>
      <Billboard position={[0, 1.75, 0]}>
        <Text fontSize={0.14} color={BASE.gold} anchorX="center" outlineWidth={0.004} outlineColor="#000">{name}</Text>
        <Text position={[0, -0.16, 0]} fontSize={0.09} color={color} anchorX="center">● {status}</Text>
      </Billboard>
    </group>
  );
}

/* ---------- project board ---------- */
export function ProjectBoard({ position, primary, secondary, onPick }: { position: [number, number, number]; primary: string; secondary: string; onPick: (id: string) => void }) {
  const cols = [['SCHEDULED', '#888'], ['ACTIVE', secondary], ['DONE', '#34f5a0']] as const;
  return (
    <group position={position}>
      <Inspect id="board" onPick={onPick}>
        <RoundedBox args={[3.2, 1.8, 0.08]} radius={0.04}><meshStandardMaterial color={BASE.marbleHi} metalness={0.4} roughness={0.5} /></RoundedBox>
        <mesh position={[0, 0.82, 0.05]}><planeGeometry args={[3, 0.18]} /><meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.3} /></mesh>
        {cols.map(([label, col], ci) => (
          <group key={label} position={[(ci - 1) * 1.0, 0, 0.06]}>
            <Text position={[0, 0.62, 0]} fontSize={0.1} color={col as string} anchorX="center">{label}</Text>
            {Array.from({ length: 3 }).map((_, i) => <mesh key={i} position={[0, 0.3 - i * 0.42, 0.01]}><planeGeometry args={[0.84, 0.34]} /><meshStandardMaterial color={col as string} emissive={col as string} emissiveIntensity={0.12} transparent opacity={0.85} /></mesh>)}
          </group>
        ))}
      </Inspect>
    </group>
  );
}

export function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.18, 0.22, 0.5, 12]} /><meshStandardMaterial color={BASE.marbleHi} roughness={0.6} /></mesh>
      <mesh position={[0, 0.52, 0]}><cylinderGeometry args={[0.19, 0.19, 0.04, 12]} /><meshStandardMaterial color={BASE.gold} metalness={0.8} roughness={0.3} /></mesh>
      {Array.from({ length: 6 }).map((_, i) => <mesh key={i} position={[Math.cos(i) * 0.12, 0.95, Math.sin(i) * 0.12]} rotation={[Math.cos(i) * 0.4, i, Math.sin(i) * 0.4]}><coneGeometry args={[0.14, 1.0, 5]} /><meshStandardMaterial color={i % 2 ? '#3f6b46' : '#2c5234'} roughness={1} /></mesh>)}
    </group>
  );
}

/* ---------- camera intro orbit ---------- */
export function Rig() {
  const { camera } = useThree(); const t0 = useRef(0);
  useFrame((s, dt) => { t0.current = Math.min(t0.current + dt, 6); const k = t0.current / 6; const a = -0.6 + k * 0.5; const r = 9.5 - k * 1.2; camera.position.lerp(new THREE.Vector3(Math.sin(a) * r, 5.2 - k * 0.6, Math.cos(a) * r), 0.06); camera.lookAt(0, 1.3, -1); });
  return null;
}

/* ============ the room engine ============ */
export function DepartmentRoom({ cfg, onPick, signature }: { cfg: DeptConfig; onPick: (id: string) => void; signature?: ReactNode }) {
  return (
    <>
      <color attach="background" args={['#050507']} />
      <fog attach="fog" args={['#050507', 16, 40]} />
      <ambientLight intensity={0.28} />
      <directionalLight position={[6, 12, 6]} intensity={1.0} color="#fff3d8" castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-12, 12, 12, -12, 0.1, 40]} />
      </directionalLight>
      <pointLight position={[0, 4.5, 0]} intensity={0.7} color={BASE.gold} distance={18} />
      <pointLight position={[-4, 2, 3]} intensity={0.5} color={cfg.primary} distance={13} />
      <pointLight position={[4, 2, 3]} intensity={0.45} color={cfg.secondary} distance={13} />
      <spotLight position={[0, 6, -2]} angle={0.5} penumbra={0.8} intensity={1.2} color={BASE.goldHi} target-position={[0, 0, -1.4]} castShadow />

      {/* reflective floor + gold ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[24, 24]} />
        <MeshReflectorMaterial mirror={0.4} resolution={1024} mixBlur={8} mixStrength={1.1} blur={[300, 100]} roughness={0.6} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.2} color={BASE.marble} metalness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[2.4, 2.55, 64]} /><meshStandardMaterial color={cfg.primary} metalness={0.9} roughness={0.25} emissive={cfg.primary} emissiveIntensity={0.25} /></mesh>

      {/* back wall + emblem */}
      <mesh position={[0, 3, -6]} receiveShadow><boxGeometry args={[16, 6, 0.2]} /><meshStandardMaterial color={BASE.marbleHi} roughness={0.6} metalness={0.15} /></mesh>
      <Inspect id="logo" onPick={onPick}>
        <Float speed={1.5} floatIntensity={0.3} rotationIntensity={0.1}>
          <group position={[0, 3.6, -5.85]}>
            {[0, 1, 2, 3].map((i) => <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]}><torusGeometry args={[0.5, 0.09, 10, 28, Math.PI * 1.3]} /><meshStandardMaterial color={BASE.gold} metalness={0.95} roughness={0.18} emissive={BASE.gold} emissiveIntensity={0.35} /></mesh>)}
            <mesh><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color={BASE.goldHi} emissive={BASE.goldHi} emissiveIntensity={1.2} /></mesh>
          </group>
        </Float>
        <Text position={[0, 2.5, -5.8]} fontSize={0.46} color={BASE.gold} anchorX="center" letterSpacing={0.3}>{cfg.title}</Text>
        <Text position={[0, 2.08, -5.8]} fontSize={0.13} color={cfg.primary} anchorX="center" letterSpacing={0.3}>{cfg.subtitle}</Text>
      </Inspect>

      {/* glass walls + windows tinted to dept color */}
      <mesh position={[-8, 3, 0]}><boxGeometry args={[0.1, 6, 12]} /><meshStandardMaterial color={BASE.glass} transparent opacity={0.08} metalness={0.4} roughness={0.1} /></mesh>
      <mesh position={[8, 3, 0]}><boxGeometry args={[0.1, 6, 12]} /><meshStandardMaterial color={BASE.glass} transparent opacity={0.08} metalness={0.4} roughness={0.1} /></mesh>
      <mesh position={[5, 3.4, -5.88]}><planeGeometry args={[4.5, 2.6]} /><meshStandardMaterial color="#0c1722" emissive={cfg.secondary} emissiveIntensity={0.28} /></mesh>
      <mesh position={[-5, 3.4, -5.88]}><planeGeometry args={[4.5, 2.6]} /><meshStandardMaterial color="#0c1722" emissive={cfg.secondary} emissiveIntensity={0.28} /></mesh>

      {/* desk */}
      <Inspect id="desk" onPick={onPick}>
        <RoundedBox args={[4.2, 0.18, 1.5]} radius={0.06} position={[0, 0.78, -1.0]} castShadow receiveShadow><meshStandardMaterial color={BASE.marble} metalness={0.4} roughness={0.3} /></RoundedBox>
        <mesh position={[0, 0.68, -1.0]}><boxGeometry args={[4.24, 0.04, 1.54]} /><meshStandardMaterial color={BASE.gold} metalness={0.92} roughness={0.22} emissive={BASE.gold} emissiveIntensity={0.15} /></mesh>
        <mesh position={[-1.9, 0.34, -1.0]}><boxGeometry args={[0.16, 0.68, 1.3]} /><meshStandardMaterial color={BASE.charcoal} /></mesh>
        <mesh position={[1.9, 0.34, -1.0]}><boxGeometry args={[0.16, 0.68, 1.3]} /><meshStandardMaterial color={BASE.charcoal} /></mesh>
      </Inspect>

      {/* triple screens from config */}
      <Inspect id="screens" onPick={onPick}>
        <Screen position={[-1.4, 1.5, -1.5]} rotation={[0, 0.4, 0]} accent={accentOf(cfg, cfg.screens[0].accent)} kind={cfg.screens[0].kind} />
        <Screen position={[0, 1.6, -1.6]} w={1.9} h={1.0} accent={accentOf(cfg, cfg.screens[1].accent)} kind={cfg.screens[1].kind} />
        <Screen position={[1.4, 1.5, -1.5]} rotation={[0, -0.4, 0]} accent={accentOf(cfg, cfg.screens[2].accent)} kind={cfg.screens[2].kind} />
      </Inspect>

      {/* hologram */}
      <Inspect id="hologram" onPick={onPick}><Hologram position={[2.8, 0.05, 1.2]} primary={cfg.primary} secondary={cfg.secondary} /></Inspect>

      {/* agent */}
      <Agent color={cfg.agentColor} name={cfg.agentName} status={cfg.agentStatus} bubbles={cfg.bubbles} onPick={onPick} />

      {/* board + base props */}
      <ProjectBoard position={[-5.4, 2.2, -2]} primary={cfg.primary} secondary={cfg.secondary} onPick={onPick} />
      <Plant position={[-3.4, 0, 2.6]} /><Plant position={[3.6, 0, 2.8]} />

      {/* department signature props */}
      {signature}

      <Particles color={cfg.primary} />
      <ContactShadows position={[0, 0.005, 0]} opacity={0.55} scale={26} blur={2.4} far={8} />
      <Environment preset="night" />
    </>
  );
}
