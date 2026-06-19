'use client';
/**
 * 6 EMPIRES — Executive Command Center (showcase / master template).
 * One production-quality room: premium black-marble + gold + white materials,
 * layered lighting, world-map hologram, animated analytics, the working Boss
 * agent with speech bubbles, a physical project board, ambient particles, and
 * click-to-inspect. This room is the bar every other department will match.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useState, useMemo } from 'react';
import { Environment, ContactShadows, Float, Text, Billboard, RoundedBox, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

const C = {
  marble: '#0e0f13', marbleHi: '#1b1d24', wood: '#5c4326', gold: '#d4af37', goldHi: '#f4d98b',
  white: '#e8e6df', glass: '#bcdce8', green: '#34f5a0', blue: '#3b82f6', emerald: '#10b981',
  charcoal: '#23252d', ink: '#06070a',
};

/* ---------- inspectable wrapper ---------- */
function Inspect({ id, onPick, children }: { id: string; onPick: (id: string) => void; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <group
      onClick={(e) => { e.stopPropagation(); onPick(id); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'auto'; }}
    >
      {children}
      {h && <pointLight position={[0, 1.5, 0]} intensity={0.4} color={C.goldHi} distance={3} />}
    </group>
  );
}

/* ---------- animated analytics screen ---------- */
function AnalyticsScreen({ position, rotation = [0, 0, 0], w = 1.6, h = 0.9, accent = C.green, kind = 'chart' }:
  { position: [number, number, number]; rotation?: [number, number, number]; w?: number; h?: number; accent?: string; kind?: 'chart' | 'map' | 'bars' }) {
  const line = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((s) => { if (mat.current) mat.current.emissiveIntensity = 0.5 + Math.sin(s.clock.elapsedTime * 2) * 0.08; });
  const pts = useMemo(() => Array.from({ length: 24 }, (_, i) => new THREE.Vector3((i / 23 - 0.5) * w * 0.86, (Math.sin(i * 0.6) * 0.12 + (i / 23) * 0.2 - 0.1) * h, 0.02)), [w, h]);
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts]);
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w + 0.06, h + 0.06, 0.04]} radius={0.02} smoothness={4}><meshStandardMaterial color={C.charcoal} metalness={0.6} roughness={0.4} /></RoundedBox>
      <mesh position={[0, 0, 0.025]}><planeGeometry args={[w, h]} /><meshStandardMaterial ref={mat} color={C.ink} emissive={accent} emissiveIntensity={0.5} /></mesh>
      {kind === 'chart' && <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: accent }))} position={[0, 0, 0]} />}
      {kind === 'bars' && Array.from({ length: 9 }).map((_, i) => <AnimatedBar key={i} x={(i / 8 - 0.5) * w * 0.8} w={w * 0.06} maxH={h * 0.7} accent={accent} seed={i} />)}
      {kind === 'map' && <gridHelper args={[w, 10, accent, accent]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.03]} />}
    </group>
  );
}
function AnimatedBar({ x, w, maxH, accent, seed }: { x: number; w: number; maxH: number; accent: string; seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) { const hh = (0.4 + Math.abs(Math.sin(s.clock.elapsedTime * 1.2 + seed)) * 0.6) * maxH; ref.current.scale.y = hh; ref.current.position.y = hh / 2 - maxH / 2; } });
  return <mesh ref={ref} position={[x, 0, 0.03]}><boxGeometry args={[w, 1, 0.01]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} /></mesh>;
}

/* ---------- world-map hologram ---------- */
function WorldHologram({ position }: { position: [number, number, number] }) {
  const grp = useRef<THREE.Group>(null);
  useFrame((s, dt) => { if (grp.current) grp.current.rotation.y += dt * 0.18; });
  return (
    <group position={position}>
      <mesh position={[0, -0.02, 0]}><cylinderGeometry args={[0.7, 0.78, 0.05, 32]} /><meshStandardMaterial color={C.charcoal} metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.72, 0.72, 0.02, 32]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.6} /></mesh>
      <group ref={grp} position={[0, 0.6, 0]}>
        <mesh><sphereGeometry args={[0.5, 24, 24]} /><meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.3} transparent opacity={0.18} wireframe /></mesh>
        <mesh><sphereGeometry args={[0.49, 18, 18]} /><meshStandardMaterial color={C.emerald} emissive={C.emerald} emissiveIntensity={0.25} transparent opacity={0.12} /></mesh>
        {Array.from({ length: 14 }).map((_, i) => { const a = i * 0.9, b = i * 0.45; return <mesh key={i} position={[Math.cos(a) * Math.cos(b) * 0.5, Math.sin(b) * 0.5, Math.sin(a) * Math.cos(b) * 0.5]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color={C.goldHi} emissive={C.goldHi} emissiveIntensity={1} /></mesh>; })}
      </group>
      {/* projection cone */}
      <mesh position={[0, 0.32, 0]}><coneGeometry args={[0.62, 0.7, 24, 1, true]} /><meshBasicMaterial color={C.blue} transparent opacity={0.04} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

/* ---------- ambient floating particles ---------- */
function Particles({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { p[i * 3] = (Math.random() - 0.5) * 16; p[i * 3 + 1] = Math.random() * 6; p[i * 3 + 2] = (Math.random() - 0.5) * 16; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
  }, [count]);
  useFrame((s) => { if (ref.current) { ref.current.rotation.y = s.clock.elapsedTime * 0.02; const pos = ref.current.geometry.attributes.position; for (let i = 0; i < count; i++) { pos.array[i * 3 + 1] += 0.002; if (pos.array[i * 3 + 1] > 6) pos.array[i * 3 + 1] = 0; } pos.needsUpdate = true; } });
  return <points ref={ref} geometry={geo}><pointsMaterial size={0.02} color={C.goldHi} transparent opacity={0.5} sizeAttenuation /></points>;
}

/* ---------- the working Boss agent ---------- */
function BossAgent({ onPick }: { onPick: (id: string) => void }) {
  const body = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const [bubble, setBubble] = useState(0);
  const lines = ['Reviewing Q3 strategy…', 'Markets up 8.2% ✦', 'Deploying agents…', 'Empire status: optimal'];
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (body.current) { body.current.position.y = 1.0 + Math.sin(t * 1.4) * 0.025; body.current.rotation.y = Math.sin(t * 0.5) * 0.12; }
    if (arm.current) arm.current.rotation.x = -0.5 + Math.sin(t * 6) * 0.25; // "typing"
    setBubble(Math.floor(t / 4) % lines.length);
  });
  return (
    <group position={[0, 0, -1.4]}>
      <Inspect id="boss" onPick={onPick}>
        <group ref={body} position={[0, 1.0, 0]}>
          <mesh castShadow><sphereGeometry args={[0.3, 24, 18]} /><meshStandardMaterial color={C.white} roughness={0.35} metalness={0.15} emissive={C.gold} emissiveIntensity={0.06} /></mesh>
          <mesh position={[0, -0.26, 0]} castShadow><sphereGeometry args={[0.24, 18, 14]} /><meshStandardMaterial color={C.white} roughness={0.4} /></mesh>
          <mesh position={[-0.1, 0.04, 0.26]}><sphereGeometry args={[0.055, 12, 12]} /><meshStandardMaterial color={C.ink} /></mesh>
          <mesh position={[0.1, 0.04, 0.26]}><sphereGeometry args={[0.055, 12, 12]} /><meshStandardMaterial color={C.ink} /></mesh>
          <mesh position={[-0.085, 0.06, 0.3]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#fff" /></mesh>
          <mesh position={[0.115, 0.06, 0.3]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#fff" /></mesh>
          {/* gold crown ring */}
          <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.16, 0.025, 8, 24]} /><meshStandardMaterial color={C.gold} metalness={0.9} roughness={0.2} emissive={C.gold} emissiveIntensity={0.4} /></mesh>
          {/* typing arm */}
          <group ref={arm} position={[0.18, -0.2, 0.18]}><mesh><capsuleGeometry args={[0.04, 0.2, 4, 8]} /><meshStandardMaterial color={C.white} /></mesh></group>
        </group>
      </Inspect>
      {/* speech bubble */}
      <Billboard position={[0.7, 1.7, 0]}>
        <mesh><planeGeometry args={[1.6, 0.4]} /><meshBasicMaterial color={C.ink} transparent opacity={0.82} /></mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.12} color={C.goldHi} anchorX="center" maxWidth={1.5}>{lines[bubble]}</Text>
      </Billboard>
      <Billboard position={[0, 1.75, 0]}>
        <Text fontSize={0.14} color={C.gold} anchorX="center" outlineWidth={0.004} outlineColor="#000">EMPIRE BOSS</Text>
        <Text position={[0, -0.16, 0]} fontSize={0.09} color={C.green} anchorX="center">● COMMANDING</Text>
      </Billboard>
    </group>
  );
}

/* ---------- physical project board (kanban wall) ---------- */
function ProjectBoard({ position, onPick }: { position: [number, number, number]; onPick: (id: string) => void }) {
  const cols = [['SCHEDULED', '#888'], ['ACTIVE', C.blue], ['DONE', C.green]] as const;
  return (
    <group position={position}>
      <Inspect id="board" onPick={onPick}>
        <RoundedBox args={[3.2, 1.8, 0.08]} radius={0.04}><meshStandardMaterial color={C.marbleHi} metalness={0.4} roughness={0.5} /></RoundedBox>
        <mesh position={[0, 0.82, 0.05]}><planeGeometry args={[3, 0.18]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.3} /></mesh>
        {cols.map(([label, col], ci) => (
          <group key={label} position={[(ci - 1) * 1.0, 0, 0.06]}>
            <Text position={[0, 0.62, 0]} fontSize={0.1} color={col as string} anchorX="center">{label}</Text>
            {Array.from({ length: 3 }).map((_, i) => (
              <mesh key={i} position={[0, 0.3 - i * 0.42, 0.01]}><planeGeometry args={[0.84, 0.34]} /><meshStandardMaterial color={col as string} emissive={col as string} emissiveIntensity={0.12} transparent opacity={0.85} /></mesh>
            ))}
          </group>
        ))}
      </Inspect>
    </group>
  );
}

/* ---------- prop helpers ---------- */
function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.18, 0.22, 0.5, 12]} /><meshStandardMaterial color={C.marbleHi} roughness={0.6} /></mesh>
      <mesh position={[0, 0.52, 0]}><cylinderGeometry args={[0.19, 0.19, 0.04, 12]} /><meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} /></mesh>
      {Array.from({ length: 6 }).map((_, i) => <mesh key={i} position={[Math.cos(i) * 0.12, 0.95, Math.sin(i) * 0.12]} rotation={[Math.cos(i) * 0.4, i, Math.sin(i) * 0.4]}><coneGeometry args={[0.14, 1.0, 5]} /><meshStandardMaterial color={i % 2 ? '#3f6b46' : '#2c5234'} roughness={1} /></mesh>)}
    </group>
  );
}
function CoffeeMachine({ position, onPick }: { position: [number, number, number]; onPick: (id: string) => void }) {
  return (
    <group position={position}>
      <Inspect id="coffee" onPick={onPick}>
        <RoundedBox args={[0.4, 0.6, 0.4]} radius={0.04} position={[0, 0.3, 0]}><meshStandardMaterial color={C.charcoal} metalness={0.5} roughness={0.4} /></RoundedBox>
        <mesh position={[0, 0.5, 0.18]}><boxGeometry args={[0.3, 0.12, 0.02]} /><meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.5} /></mesh>
        <mesh position={[0, 0.12, 0.16]}><cylinderGeometry args={[0.07, 0.07, 0.12, 12]} /><meshStandardMaterial color={C.white} /></mesh>
      </Inspect>
    </group>
  );
}

/* ---------- camera intro orbit ---------- */
function Rig() {
  const { camera } = useThree();
  const t0 = useRef(0);
  useFrame((s, dt) => {
    t0.current = Math.min(t0.current + dt, 6);
    const k = t0.current / 6;
    const a = -0.6 + k * 0.5;
    const r = 9.5 - k * 1.2;
    camera.position.lerp(new THREE.Vector3(Math.sin(a) * r, 5.2 - k * 0.6, Math.cos(a) * r), 0.06);
    camera.lookAt(0, 1.3, -1);
  });
  return null;
}

export default function ExecutiveScene({ onPick }: { onPick?: (id: string) => void }) {
  const pick = onPick ?? (() => {});
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [7, 5, 8], fov: 36, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#050507']} />
      <fog attach="fog" args={['#050507', 16, 40]} />
      {/* layered lighting */}
      <ambientLight intensity={0.28} />
      <directionalLight position={[6, 12, 6]} intensity={1.0} color="#fff3d8" castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-12, 12, 12, -12, 0.1, 40]} />
      </directionalLight>
      <pointLight position={[0, 4.5, 0]} intensity={0.7} color={C.gold} distance={18} />
      <pointLight position={[-4, 2, 3]} intensity={0.4} color={C.blue} distance={12} />
      <pointLight position={[4, 2, 3]} intensity={0.35} color={C.emerald} distance={12} />
      <spotLight position={[0, 6, -2]} angle={0.5} penumbra={0.8} intensity={1.2} color={C.goldHi} target-position={[0, 0, -1.4]} castShadow />

      <Suspense fallback={null}>
        {/* reflective marble floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[24, 24]} />
          <MeshReflectorMaterial mirror={0.45} resolution={1024} mixBlur={8} mixStrength={1.2} blur={[300, 100]} roughness={0.6} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.2} color={C.marble} metalness={0.5} />
        </mesh>
        {/* gold floor ring inlay */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[2.4, 2.55, 64]} /><meshStandardMaterial color={C.gold} metalness={0.9} roughness={0.25} emissive={C.gold} emissiveIntensity={0.2} /></mesh>

        {/* back wall + Empire logo emblem */}
        <mesh position={[0, 3, -6]} receiveShadow><boxGeometry args={[16, 6, 0.2]} /><meshStandardMaterial color={C.marbleHi} roughness={0.6} metalness={0.15} /></mesh>
        <Inspect id="logo" onPick={pick}>
          <Float speed={1.5} floatIntensity={0.3} rotationIntensity={0.1}>
            <group position={[0, 3.6, -5.85]}>
              {[0, 1, 2, 3].map((i) => <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]}><torusGeometry args={[0.5, 0.09, 10, 28, Math.PI * 1.3]} /><meshStandardMaterial color={C.gold} metalness={0.95} roughness={0.18} emissive={C.gold} emissiveIntensity={0.35} /></mesh>)}
              <mesh><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color={C.goldHi} emissive={C.goldHi} emissiveIntensity={1.2} /></mesh>
            </group>
          </Float>
          <Text position={[0, 2.5, -5.8]} fontSize={0.5} color={C.gold} anchorX="center" letterSpacing={0.32} font={undefined}>6 EMPIRES</Text>
          <Text position={[0, 2.05, -5.8]} fontSize={0.14} color={C.white} anchorX="center" letterSpacing={0.3}>EXECUTIVE COMMAND CENTER</Text>
        </Inspect>

        {/* side glass walls */}
        <mesh position={[-8, 3, 0]}><boxGeometry args={[0.1, 6, 12]} /><meshStandardMaterial color={C.glass} transparent opacity={0.08} metalness={0.4} roughness={0.1} /></mesh>
        <mesh position={[8, 3, 0]}><boxGeometry args={[0.1, 6, 12]} /><meshStandardMaterial color={C.glass} transparent opacity={0.08} metalness={0.4} roughness={0.1} /></mesh>
        {/* city window glow on back wall */}
        <mesh position={[5, 3.4, -5.88]}><planeGeometry args={[4.5, 2.6]} /><meshStandardMaterial color="#0c1722" emissive="#26415e" emissiveIntensity={0.5} /></mesh>
        <mesh position={[-5, 3.4, -5.88]}><planeGeometry args={[4.5, 2.6]} /><meshStandardMaterial color="#0c1722" emissive="#26415e" emissiveIntensity={0.5} /></mesh>

        {/* massive executive desk */}
        <Inspect id="desk" onPick={pick}>
          <RoundedBox args={[4.2, 0.18, 1.5]} radius={0.06} position={[0, 0.78, -1.0]} castShadow receiveShadow><meshStandardMaterial color={C.marble} metalness={0.4} roughness={0.3} /></RoundedBox>
          <mesh position={[0, 0.68, -1.0]}><boxGeometry args={[4.24, 0.04, 1.54]} /><meshStandardMaterial color={C.gold} metalness={0.92} roughness={0.22} emissive={C.gold} emissiveIntensity={0.15} /></mesh>
          <mesh position={[-1.9, 0.34, -1.0]}><boxGeometry args={[0.16, 0.68, 1.3]} /><meshStandardMaterial color={C.charcoal} /></mesh>
          <mesh position={[1.9, 0.34, -1.0]}><boxGeometry args={[0.16, 0.68, 1.3]} /><meshStandardMaterial color={C.charcoal} /></mesh>
        </Inspect>

        {/* curved triple analytics on the desk */}
        <Inspect id="screens" onPick={pick}>
          <AnalyticsScreen position={[-1.4, 1.5, -1.5]} rotation={[0, 0.4, 0]} accent={C.green} kind="chart" />
          <AnalyticsScreen position={[0, 1.6, -1.6]} w={1.9} h={1.0} accent={C.gold} kind="bars" />
          <AnalyticsScreen position={[1.4, 1.5, -1.5]} rotation={[0, -0.4, 0]} accent={C.blue} kind="map" />
        </Inspect>

        {/* world-map hologram on a pedestal */}
        <Inspect id="hologram" onPick={pick}><WorldHologram position={[2.8, 0.05, 1.2]} /></Inspect>

        {/* the working boss */}
        <BossAgent onPick={pick} />

        {/* project board on left wall */}
        <ProjectBoard position={[-5.4, 2.2, -2]} onPick={pick} />

        {/* props */}
        <Plant position={[-3.4, 0, 2.6]} />
        <Plant position={[3.6, 0, 2.8]} />
        <CoffeeMachine position={[-2.6, 0, 2.4]} onPick={pick} />
        {/* books stack */}
        <group position={[1.7, 0.88, -1.0]}>
          {[0, 1, 2].map((i) => <mesh key={i} position={[0, i * 0.06, 0]} rotation={[0, i * 0.2, 0]}><boxGeometry args={[0.36, 0.05, 0.26]} /><meshStandardMaterial color={[C.gold, '#7a2e2e', '#27405e'][i]} roughness={0.6} /></mesh>)}
        </group>
        {/* leather lounge */}
        <RoundedBox args={[2.0, 0.4, 0.9]} radius={0.1} position={[-3.2, 0.3, 3.2]}><meshStandardMaterial color="#1a1410" roughness={0.7} /></RoundedBox>

        <Particles />
        <ContactShadows position={[0, 0.005, 0]} opacity={0.55} scale={26} blur={2.4} far={8} />
        <Environment preset="night" />
      </Suspense>
      <Rig />
    </Canvas>
  );
}
