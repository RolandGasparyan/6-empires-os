'use client';
/**
 * 6 EMPIRES CORPORATION — the CONNECTED world.
 * Multiple departments laid out as adjacent rooms around a central atrium,
 * physically connected by corridors. All 12 named agents placed in their home
 * rooms; several agents WALK between departments along the corridors. Click an
 * agent → profile; click a room → camera flies in. Premium stylized R3F.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useState, useMemo } from 'react';
import { Environment, ContactShadows, Text, RoundedBox, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Character } from './Character';
import { Screen, Hologram, Particles, Plant, Inspect, BASE } from './roomKit';
import { TEAM, byRoom, TeamMember } from './team';

/** Room slots on the campus grid. */
interface Slot { id: string; label: string; accent: string; pos: [number, number]; }
const GAP = 14;
const ROOMS: Slot[] = [
  { id: 'command',   label: 'COMMAND',   accent: '#d4af37', pos: [0, 0] },
  { id: 'workspace', label: 'WORKSPACE', accent: '#34f5a0', pos: [GAP, 0] },
  { id: 'datalab',   label: 'DATA LAB',  accent: '#a855f7', pos: [-GAP, 0] },
  { id: 'trading',   label: 'TRADING',   accent: '#22c55e', pos: [0, GAP] },
  { id: 'meeting',   label: 'MEETING',   accent: '#3b82f6', pos: [0, -GAP] },
  { id: 'lounge',    label: 'LOUNGE',    accent: '#06b6d4', pos: [GAP, GAP] },
];

/* ---- one department room with its furniture + home agents ---- */
function RoomCell({ slot, onAgent, onRoom, focused }: { slot: Slot; onAgent: (m: TeamMember) => void; onRoom: (s: Slot) => void; focused: boolean }) {
  const [hover, setHover] = useState(false);
  const home = byRoom(slot.id);
  const W = 10, D = 10, H = 4.5;
  return (
    <group position={[slot.pos[0], 0, slot.pos[1]]}>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={(e) => { e.stopPropagation(); onRoom(slot); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={BASE.marble} roughness={0.4} metalness={0.2} />
      </mesh>
      {(hover || focused) && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><planeGeometry args={[W - 0.2, D - 0.2]} /><meshBasicMaterial color={slot.accent} transparent opacity={hover ? 0.08 : 0.04} /></mesh>}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[2.2, 2.35, 48]} /><meshStandardMaterial color={slot.accent} metalness={0.8} roughness={0.3} emissive={slot.accent} emissiveIntensity={0.25} /></mesh>

      {/* two back walls (cutaway) */}
      <mesh position={[0, H / 2, -D / 2]} receiveShadow><boxGeometry args={[W, H, 0.16]} /><meshStandardMaterial color={BASE.marbleHi} roughness={0.65} metalness={0.12} /></mesh>
      <mesh position={[-W / 2, H / 2, 0]} receiveShadow><boxGeometry args={[0.16, H, D]} /><meshStandardMaterial color={BASE.charcoal} roughness={0.7} /></mesh>
      {/* gold baseboard */}
      <mesh position={[0, 0.07, -D / 2 + 0.1]}><boxGeometry args={[W, 0.07, 0.04]} /><meshStandardMaterial color={slot.accent} metalness={0.9} roughness={0.3} /></mesh>
      {/* label */}
      <Text position={[0, H * 0.8, -D / 2 + 0.12]} fontSize={0.5} color={slot.accent} anchorX="center" letterSpacing={0.16} outlineWidth={0.005} outlineColor="#000">{slot.label}</Text>
      {/* window glow */}
      <mesh position={[W * 0.26, H * 0.6, -D / 2 + 0.1]}><planeGeometry args={[W * 0.34, H * 0.4]} /><meshStandardMaterial color="#0c1722" emissive={slot.accent} emissiveIntensity={0.22} /></mesh>

      {/* a couple of desks + screens */}
      {home.slice(0, 3).map((m, i) => {
        const x = (i - 1) * 2.7, z = -1.4;
        return (
          <group key={m.id} position={[x, 0, z]}>
            <RoundedBox args={[1.7, 0.12, 0.85]} radius={0.04} position={[0, 0.74, -0.4]} castShadow receiveShadow><meshStandardMaterial color={BASE.marbleHi} metalness={0.4} roughness={0.35} /></RoundedBox>
            <mesh position={[0, 0.68, -0.4]}><boxGeometry args={[1.72, 0.03, 0.87]} /><meshStandardMaterial color={m.color} metalness={0.6} roughness={0.35} emissive={m.color} emissiveIntensity={0.2} /></mesh>
            <Screen position={[0, 1.12, -0.66]} w={0.95} h={0.52} accent={m.color} kind={m.gesture === 'scan' ? 'grid' : m.gesture === 'type' ? 'code' : 'chart'} />
            <Inspect id={m.id} onPick={() => onAgent(m)}>
              <Character position={[0, 0, 0.2]} color={m.color} accent={BASE.goldHi} gesture={m.gesture} name={m.name.split(' ')[0].toUpperCase()} status={m.status} seed={m.id.charCodeAt(0)} scale={0.92} />
            </Inspect>
          </group>
        );
      })}
      {slot.id === 'command' && <Hologram position={[2.6, 0.05, 1.6]} primary={BASE.blue} secondary={BASE.green} />}
      {slot.id === 'meeting' && <RoundedBox args={[3.4, 0.14, 1.3]} radius={0.06} position={[0, 0.78, 1]} castShadow><meshStandardMaterial color={BASE.marble} metalness={0.4} roughness={0.3} /></RoundedBox>}
      <Plant position={[W / 2 - 1.2, 0, D / 2 - 1.2]} />
    </group>
  );
}

/* ---- corridors connecting the rooms to the atrium ---- */
function Corridors() {
  return (
    <group>
      {ROOMS.filter((r) => r.id !== 'command').map((r) => {
        const [x, z] = r.pos; const len = Math.hypot(x, z); const ang = Math.atan2(z, x);
        return (
          <mesh key={r.id} position={[x / 2, 0.015, z / 2]} rotation={[-Math.PI / 2, 0, -ang]} receiveShadow>
            <planeGeometry args={[len, 2.4]} />
            <meshStandardMaterial color="#0b0c10" roughness={0.5} metalness={0.2} emissive={r.accent} emissiveIntensity={0.04} />
          </mesh>
        );
      })}
      {/* atrium ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><ringGeometry args={[3.4, 3.6, 64]} /><meshStandardMaterial color={BASE.gold} metalness={0.9} roughness={0.25} emissive={BASE.gold} emissiveIntensity={0.18} /></mesh>
    </group>
  );
}

/* ---- agents WALKING between rooms along the corridors ---- */
function Commuter({ from, to, color, phase, speed = 0.18 }: { from: [number, number]; to: [number, number]; color: string; phase: number; speed?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    const tt = (Math.sin(s.clock.elapsedTime * speed + phase) + 1) / 2; // ping-pong 0..1
    if (g.current) {
      const x = from[0] + (to[0] - from[0]) * tt;
      const z = from[1] + (to[1] - from[1]) * tt;
      g.current.position.set(x, Math.abs(Math.sin(s.clock.elapsedTime * 6 + phase)) * 0.04, z);
      g.current.rotation.y = Math.atan2(to[0] - from[0], to[1] - from[1]) * (tt < 0.5 ? 1 : 1);
    }
  });
  return <group ref={g}><Character color={color} scale={0.7} gesture="idle" /></group>;
}

function CamRig({ target }: { target: [number, number] | null }) {
  const { camera } = useThree();
  const t0 = useRef(0);
  useFrame((_, dt) => {
    t0.current = Math.min(t0.current + dt, 8);
    const desired = target
      ? new THREE.Vector3(target[0] + 8, 9, target[1] + 8)
      : new THREE.Vector3(22, 24, 22);
    camera.position.lerp(desired, 0.04);
    camera.lookAt(target ? target[0] : 0, 1, target ? target[1] : 0);
  });
  return null;
}

export default function ConnectedWorld({ onAgent }: { onAgent?: (m: TeamMember) => void }) {
  const pick = onAgent ?? (() => {});
  const [focus, setFocus] = useState<[number, number] | null>(null);
  // a few commuters walking room↔atrium
  const commuters = useMemo(() => [
    { from: [0, 0] as [number, number], to: ROOMS[1].pos, color: '#34f5a0', phase: 0 },
    { from: ROOMS[2].pos, to: [0, 0] as [number, number], color: '#a855f7', phase: 2 },
    { from: ROOMS[3].pos, to: [0, 0] as [number, number], color: '#22c55e', phase: 4 },
    { from: ROOMS[1].pos, to: ROOMS[5].pos, color: '#06b6d4', phase: 1.5 },
  ], []);
  return (
    <Canvas shadows dpr={[1, 1.8]} camera={{ position: [22, 24, 22], fov: 34, near: 0.1, far: 260 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }} onPointerMissed={() => setFocus(null)}>
      <color attach="background" args={['#060708']} />
      <fog attach="fog" args={['#060708', 36, 90]} />
      <ambientLight intensity={0.34} />
      <directionalLight position={[16, 26, 12]} intensity={1.05} color="#fff2d6" castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-40, 40, 40, -40, 0.1, 80]} />
      </directionalLight>
      <pointLight position={[0, 10, 0]} intensity={0.6} color={BASE.gold} distance={50} />

      <Suspense fallback={null}>
        {/* big reflective base floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[70, 70]} />
          <MeshReflectorMaterial mirror={0.35} resolution={1024} mixBlur={10} mixStrength={1} blur={[300, 100]} roughness={0.7} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.2} color="#070809" metalness={0.5} />
        </mesh>
        <Corridors />
        {ROOMS.map((r) => <RoomCell key={r.id} slot={r} onAgent={pick} onRoom={(s) => setFocus(s.pos)} focused={focus?.[0] === r.pos[0] && focus?.[1] === r.pos[1]} />)}
        {commuters.map((c, i) => <Commuter key={i} {...c} />)}
        {/* central emblem */}
        <Text position={[0, 5.5, 0]} fontSize={0.7} color={BASE.gold} anchorX="center" letterSpacing={0.3}>6 EMPIRES</Text>
        <Particles color={BASE.gold} count={140} />
        <ContactShadows position={[0, 0.005, 0]} opacity={0.45} scale={70} blur={2.6} far={14} />
        <Environment preset="night" />
      </Suspense>
      <CamRig target={focus} />
    </Canvas>
  );
}
