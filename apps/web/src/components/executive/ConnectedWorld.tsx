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
import { Environment, ContactShadows, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { HumanCharacter } from './HumanCharacter';
import { Hologram, Inspect, BASE } from './roomKit';
import { Workstation, WallScreen, Pot, Art, Chair, TrophyShelf, Lounge } from './RoomDetail';
import { TEAM, byRoom, TeamMember } from './team';

/** Room slots on the campus grid. */
interface Slot { id: string; label: string; accent: string; pos: [number, number]; }
const GAP = 14;
const ROOMS: Slot[] = [
  { id: 'command',   label: 'COMMAND',   accent: '#c79be0', pos: [0, 0] },
  { id: 'workspace', label: 'WORKSPACE', accent: '#34f5a0', pos: [GAP, 0] },
  { id: 'datalab',   label: 'DATA LAB',  accent: '#a855f7', pos: [-GAP, 0] },
  { id: 'trading',   label: 'TRADING',   accent: '#22c55e', pos: [0, GAP] },
  { id: 'meeting',   label: 'MEETING',   accent: '#3b82f6', pos: [0, -GAP] },
  { id: 'media',     label: 'MEDIA STUDIO', accent: '#06b6d4', pos: [GAP, GAP] },
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
        <meshStandardMaterial color="#2aa39a" roughness={0.85} metalness={0.05} />
      </mesh>
      {(hover || focused) && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><planeGeometry args={[W - 0.2, D - 0.2]} /><meshBasicMaterial color={slot.accent} transparent opacity={hover ? 0.08 : 0.04} /></mesh>}

      {/* two back walls — soft pastel pink (Arturitu mockup) */}
      <mesh position={[0, H / 2, -D / 2]} receiveShadow><boxGeometry args={[W, H, 0.16]} /><meshStandardMaterial color="#f4b8cf" roughness={0.95} metalness={0} /></mesh>
      <mesh position={[-W / 2, H / 2, 0]} receiveShadow><boxGeometry args={[0.16, H, D]} /><meshStandardMaterial color="#f0a8c4" roughness={0.95} metalness={0} /></mesh>
      {/* soft pastel cove lighting along wall tops (gentle warm-white glow) */}
      <mesh position={[0, H - 0.15, -D / 2 + 0.12]}><boxGeometry args={[W * 0.9, 0.04, 0.04]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.45} /></mesh>
      <mesh position={[-W / 2 + 0.12, H - 0.15, 0]}><boxGeometry args={[0.04, 0.04, D * 0.9]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.45} /></mesh>
      {/* soft pastel baseboard */}
      <mesh position={[0, 0.07, -D / 2 + 0.1]}><boxGeometry args={[W, 0.07, 0.04]} /><meshStandardMaterial color="#f7d6e4" metalness={0.05} roughness={0.6} /></mesh>
      {/* soft pastel EMPIRE emblem + wordmark on back wall (Arturitu) */}
      <group position={[0, H * 0.62, -D / 2 + 0.14]}>
        {[0, 1, 2, 3].map((i) => <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]}><torusGeometry args={[0.42, 0.07, 8, 24, Math.PI * 1.3]} /><meshStandardMaterial color="#c79be0" metalness={0.1} roughness={0.5} emissive="#c79be0" emissiveIntensity={0.18} /></mesh>)}
        <mesh><sphereGeometry args={[0.08, 14, 14]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.5} /></mesh>
      </group>
      <Text position={[0, H * 0.32, -D / 2 + 0.14]} fontSize={0.34} color="#3a2440" anchorX="center" letterSpacing={0.28}>6 EMPIRES</Text>
      <Text position={[0, H * 0.86, -D / 2 + 0.12]} fontSize={0.32} color="#3a2440" anchorX="center" letterSpacing={0.16} outlineWidth={0.004} outlineColor="#ffffff">{slot.label}</Text>
      {/* soft pastel feature windows */}
      <mesh position={[W * 0.3, H * 0.55, -D / 2 + 0.1]}><planeGeometry args={[W * 0.3, H * 0.42]} /><meshStandardMaterial color="#bfeaf0" emissive="#9fdce6" emissiveIntensity={0.3} /></mesh>

      {/* fully-furnished workstations — agents seated, working (command room
          uses the dedicated Boss Office below instead of generic stations) */}
      {slot.id !== 'command' && home.slice(0, 3).map((m, i) => {
        const x = (i - 1) * 2.9, z = -1.6;
        const screenKind = m.gesture === 'scan' ? 'grid' : m.gesture === 'type' ? 'code' : m.gesture === 'point' ? 'ui' : 'chart';
        return (
          <group key={m.id} position={[x, 0, z]}>
            <Workstation position={[0, 0, 0]} color={m.color} kind={screenKind as any} />
            {/* seated stylized-human agent */}
            <Inspect id={m.id} onPick={() => onAgent(m)}>
              <HumanCharacter position={[0, 0.18, 0.78]} suit={m.color} hair={m.hair} beard={m.beard} glasses={m.glasses} bowtie={m.bowtie} gesture={m.gesture} name={m.name.split(' ')[0].toUpperCase()} status={m.status} seed={m.id.charCodeAt(0)} scale={0.7} />
            </Inspect>
          </group>
        );
      })}

      {/* wall screens (big animated displays) on the back wall */}
      <WallScreen position={[-2.6, 3, -D / 2 + 0.12]} w={2.0} h={1.1} accent={slot.accent} kind="chart" />
      <WallScreen position={[2.6, 3, -D / 2 + 0.12]} w={2.0} h={1.1} accent={slot.accent} kind={slot.id === 'datalab' ? 'code' : slot.id === 'trading' ? 'chart' : 'grid'} />

      {/* === BOSS OFFICE — Roland Gasparyan's executive command (reference) === */}
      {slot.id === 'command' && (() => {
        const boss = byRoom('command')[0] ?? TEAM[0];
        return (
          <group>
            {/* soft pastel executive desk */}
            <RoundedBox args={[4.4, 0.18, 1.7]} radius={0.06} position={[0, 0.82, -1.6]} castShadow receiveShadow><meshStandardMaterial color="#e9d8f0" metalness={0.1} roughness={0.5} /></RoundedBox>
            <mesh position={[0, 0.72, -1.6]}><boxGeometry args={[4.44, 0.05, 1.74]} /><meshStandardMaterial color="#f7d6e4" metalness={0.05} roughness={0.5} emissive="#ffe1ee" emissiveIntensity={0.1} /></mesh>
            <mesh position={[-2.0, 0.36, -1.6]}><boxGeometry args={[0.18, 0.72, 1.5]} /><meshStandardMaterial color="#d8c2e6" /></mesh>
            <mesh position={[2.0, 0.36, -1.6]}><boxGeometry args={[0.18, 0.72, 1.5]} /><meshStandardMaterial color="#d8c2e6" /></mesh>
            {/* curved triple command screens */}
            <WallScreen position={[-1.5, 1.55, -2.0]} rotation={[0, 0.45, 0]} w={1.2} h={0.7} accent={BASE.green} kind="chart" />
            <WallScreen position={[0, 1.65, -2.1]} w={1.5} h={0.85} accent="#c79be0" kind="ui" />
            <WallScreen position={[1.5, 1.55, -2.0]} rotation={[0, -0.45, 0]} w={1.2} h={0.7} accent={BASE.blue} kind="chart" />
            {/* the boss in his chair */}
            <Chair position={[0, 0, -0.7]} color="#b48fd0" />
            {/* soft pastel rim / halo light behind the chair */}
            <mesh position={[0, 1.5, -1.15]} rotation={[0, 0, 0]}><torusGeometry args={[0.66, 0.05, 14, 40]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.6} metalness={0.1} roughness={0.4} /></mesh>
            <PulseLight position={[0, 1.6, -1.25]} color="#ffe1ee" base={0.5} amp={0.2} dist={5} />
            <Inspect id={boss.id} onPick={() => onAgent(boss)}>
              <HumanCharacter position={[0, 0.2, -0.7]} suit="#8a6db0" hair="#141414" beard bowtie gesture="point" name="ROLAND" status="COMMANDING" scale={0.85} seed={9} />
            </Inspect>
            {/* desk accessories: pastel sculpture, globe, flag, books */}
            <mesh position={[1.5, 0.98, -1.4]} castShadow><boxGeometry args={[0.2, 0.18, 0.32]} /><meshStandardMaterial color="#e8a8c8" metalness={0.1} roughness={0.5} emissive="#ffd9e8" emissiveIntensity={0.1} /></mesh>
            <mesh position={[-1.5, 1.05, -1.4]}><sphereGeometry args={[0.16, 18, 14]} /><meshStandardMaterial color="#9fdce6" metalness={0.1} roughness={0.5} wireframe /></mesh>
            <mesh position={[-1.5, 1.05, -1.4]}><sphereGeometry args={[0.155, 14, 10]} /><meshStandardMaterial color="#cfeaf0" /></mesh>
            <group position={[1.1, 0.95, -1.5]}>{[0,1,2].map(i=><mesh key={i} position={[0,i*0.05,0]}><boxGeometry args={[0.3,0.045,0.2]}/><meshStandardMaterial color={['#e8a8c8','#b48fd0','#9fdce6'][i]} roughness={0.6}/></mesh>)}</group>
            {/* pastel floor emblem (interlocking rings) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.6]}><torusGeometry args={[0.9, 0.05, 10, 40]} /><meshStandardMaterial color="#c79be0" metalness={0.1} roughness={0.5} emissive="#c79be0" emissiveIntensity={0.12} /></mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.02, 1.6]}><torusGeometry args={[0.6, 0.045, 10, 40]} /><meshStandardMaterial color="#e8a8c8" metalness={0.1} roughness={0.5} emissive="#ffd9e8" emissiveIntensity={0.15} /></mesh>
            <Lounge position={[-3.4, 0, 2.4]} rotation={[0, 0.5, 0]} />
            {/* boss-office wall tagline */}
            <Text position={[0, H * 0.2, -D / 2 + 0.14]} fontSize={0.16} color="#3a2440" anchorX="center" letterSpacing={0.18}>WE BUILD · WE SCALE · WE OWN</Text>
            {/* team seating — 2 chairs facing the boss desk + 2 empty chairs */}
            {[{ x: -1.8, z: 1.5, r: -0.5 }, { x: 1.8, z: 1.5, r: 0.5 }].map((c) => <Chair key={'e' + c.x} position={[c.x, 0, c.z]} rotation={[0, Math.PI + c.r, 0]} color="#b48fd0" />)}
            {[{ x: -0.6, z: 1.2, r: -0.18 }, { x: 0.6, z: 1.2, r: 0.18 }].map((c, i) => (
              <group key={i}>
                <Chair position={[c.x, 0, c.z]} rotation={[0, Math.PI + c.r, 0]} color="#b48fd0" />
                <HumanCharacter position={[c.x, 0.16, c.z]} rotation={[0, Math.PI + c.r, 0]} suit={TEAM[i + 1].color} hair={TEAM[i + 1].hair} glasses={TEAM[i + 1].glasses} gesture={i % 2 === 0 ? 'think' : 'idle'} scale={0.62} seed={20 + i} />
              </group>
            ))}
            {/* gentle even key light on the CEO */}
            <spotLight position={[0, 4, 0.5]} angle={0.4} penumbra={0.7} intensity={1.2} color="#ffffff" target-position={[0, 0.6, -0.7]} />
            <pointLight position={[0, 2.2, -1]} intensity={0.4} color="#ffe1ee" distance={6} />
          </group>
        );
      })()}
      {slot.id === 'meeting' && <>
        <RoundedBox args={[3.6, 0.14, 1.4]} radius={0.06} position={[0, 0.78, 1.4]} castShadow><meshStandardMaterial color="#e9d8f0" metalness={0.1} roughness={0.5} /></RoundedBox>
        {[-1.2, 0, 1.2].map((cx) => <Chair key={cx} position={[cx, 0, 2.4]} rotation={[0, Math.PI, 0]} />)}
        {[-1.2, 0, 1.2].map((cx) => <Chair key={'b' + cx} position={[cx, 0, 0.4]} />)}
      </>}
      {slot.id === 'media' && <>
        {/* === MEDIA STUDIO — content factory === */}
        {/* big hero content wall */}
        <WallScreen position={[-1.4, 2.7, -D / 2 + 0.13]} w={3.0} h={1.7} accent="#e8772e" kind="ui" />
        {/* social feed column */}
        <WallScreen position={[1.4, 3.0, -D / 2 + 0.13]} w={1.3} h={1.0} accent="#ec4899" kind="grid" />
        {/* chart panel */}
        <WallScreen position={[1.4, 1.8, -D / 2 + 0.13]} w={1.3} h={0.9} accent="#06b6d4" kind="chart" />
        {/* video timeline strip (orange editing line) */}
        <mesh position={[-1.4, 1.5, -D / 2 + 0.16]}><boxGeometry args={[3.0, 0.34, 0.02]} /><meshStandardMaterial color="#f5e3d8" emissive="#f6a96a" emissiveIntensity={0.2} /></mesh>
        {[0,1,2,3,4,5].map(i => <mesh key={i} position={[-2.7 + i*0.52, 1.5, -D / 2 + 0.17]}><boxGeometry args={[0.42, 0.26, 0.02]} /><meshStandardMaterial color="#f6a96a" emissive="#f6a96a" emissiveIntensity={0.4} transparent opacity={0.9} /></mesh>)}
        {/* glowing peach UI side panels */}
        {[-0.6, 0.6].map(z => <mesh key={z} position={[-W/2 + 0.16, 2.4, z]} rotation={[0, Math.PI/2, 0]}><planeGeometry args={[1.2, 0.7]} /><meshStandardMaterial color="#fbe6d6" emissive="#f6a96a" emissiveIntensity={0.3} transparent opacity={0.92} /></mesh>)}
        {/* editing agent — typing bursts at the edit desk */}
        <Workstation position={[-1.4, 0, -1.6]} color="#e8772e" kind="ui" />
        <HumanCharacter position={[-1.4, 0.18, -0.82]} suit="#e8772e" hair="#1a6a7a" gesture="type" name="MEDIA" status="EDITING" scale={0.7} seed={55} />
        {/* camera rig + studio lights */}
        <mesh position={[3, 1.4, 1.5]}><cylinderGeometry args={[0.02, 0.02, 2.4, 6]} /><meshStandardMaterial color="#bfb3cc" /></mesh>
        <mesh position={[3, 2.5, 1.5]}><coneGeometry args={[0.22, 0.3, 16, 1, true]} /><meshStandardMaterial color="#cdc2d8" side={2} /></mesh>
        <SceneFlicker position={[3, 2.4, 1.5]} color="#ffffff" base={0.4} dist={4} />
        {/* second studio light (warm) on a tripod */}
        <mesh position={[-3.2, 1.5, 1.2]}><cylinderGeometry args={[0.02, 0.02, 2.6, 6]} /><meshStandardMaterial color="#bfb3cc" /></mesh>
        <mesh position={[-3.2, 2.7, 1.2]} rotation={[0.4,0,0]}><coneGeometry args={[0.2, 0.28, 16, 1, true]} /><meshStandardMaterial color="#cdc2d8" side={2} /></mesh>
        <SceneFlicker position={[-3.2, 2.6, 1.2]} color="#ffd9a8" base={0.45} dist={4.5} />
        {/* on-air camera body */}
        <mesh position={[3, 1.55, 1.5]} rotation={[0,-0.5,0]}><boxGeometry args={[0.3, 0.22, 0.42]} /><meshStandardMaterial color="#9f8fb8" metalness={0.2} roughness={0.5} /></mesh>
        <mesh position={[2.78, 1.55, 1.32]}><sphereGeometry args={[0.05, 10, 10]} /><meshStandardMaterial color="#f6a96a" emissive="#f6a96a" emissiveIntensity={1.0} /></mesh>
      </>}

      {/* shared luxury interior detail (clean black floor — no rug) */}
      <TrophyShelf position={[W / 2 - 0.3, 1.2, -1.6]} rotation={[0, -Math.PI / 2, 0]} />
      <Lounge position={[W / 2 - 1.6, 0, D / 2 - 1.4]} rotation={[0, -Math.PI / 2 - 0.3, 0]} />
      <Art position={[-W / 2 + 0.2, 2.6, -1.5]} rotation={[0, Math.PI / 2, 0]} accent={slot.accent} />
      <Art position={[-W / 2 + 0.2, 2.6, 1.0]} rotation={[0, Math.PI / 2, 0]} accent="#c79be0" />
      <Pot big position={[-W / 2 + 1.0, 0, -D / 2 + 1.0]} />
      <Pot position={[-W / 2 + 1.0, 0, D / 2 - 1.0]} />
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
            <meshStandardMaterial color="#2aa39a" roughness={0.92} metalness={0} />
          </mesh>
        );
      })}
    </group>
  );
}

/* === static light helpers (no per-frame animation) === */
function PulseLight({ position, color, base = 0.5, dist = 6 }: { position: [number, number, number]; color: string; base?: number; amp?: number; dist?: number; speed?: number }) {
  return <pointLight position={position} color={color} intensity={base} distance={dist} />;
}
function SceneFlicker({ position, color, base = 0.4, dist = 4 }: { position: [number, number, number]; color: string; base?: number; dist?: number }) {
  return <pointLight position={position} color={color} intensity={base} distance={dist} />;
}

/* === unified building shell — glass curtain wall + warm base uplights (reference) === */
function BuildingShell() {
  const R = 22;     // half-extent of the building footprint
  const H = 5.5;    // wall height
  // warm exterior uplights spaced around the base
  const uplights = useMemo(() => {
    const pts: [number, number][] = [];
    const N = 7;
    for (let i = 0; i <= N; i++) { const t = (i / N) * 2 - 1; pts.push([t * R, R + 1]); pts.push([t * R, -R - 1]); pts.push([R + 1, t * R]); pts.push([-R - 1, t * R]); }
    return pts;
  }, []);
  return (
    <group>
      {/* soft teal base plinth under the building */}
      <mesh position={[0, -0.6, 0]}><boxGeometry args={[R * 2 + 4, 1.0, R * 2 + 4]} /><meshStandardMaterial color="#1f8f88" roughness={0.8} metalness={0.1} /></mesh>
      <mesh position={[0, -0.08, 0]}><boxGeometry args={[R * 2 + 0.4, 0.16, R * 2 + 0.4]} /><meshStandardMaterial color="#34c0b4" metalness={0.1} roughness={0.5} emissive="#34c0b4" emissiveIntensity={0.06} /></mesh>
      {/* glass curtain walls on all 4 sides */}
      {([[0, -R], [0, R], [-R, 0], [R, 0]] as [number, number][]).map(([x, z], i) => (
        <group key={i} position={[x, H / 2, z]} rotation={[0, i < 2 ? 0 : Math.PI / 2, 0]}>
          <mesh><boxGeometry args={[R * 2, H, 0.06]} /><meshStandardMaterial color="#bfeaf0" transparent opacity={0.1} metalness={0.2} roughness={0.05} /></mesh>
          {/* soft white mullions */}
          {Array.from({ length: 9 }).map((_, m) => <mesh key={m} position={[-R + (m * R) / 4, 0, 0.04]}><boxGeometry args={[0.05, H, 0.05]} /><meshStandardMaterial color="#fff4f8" metalness={0.05} roughness={0.5} emissive="#ffe1ee" emissiveIntensity={0.1} /></mesh>)}
          <mesh position={[0, H / 2 - 0.05, 0.04]}><boxGeometry args={[R * 2, 0.06, 0.06]} /><meshStandardMaterial color="#fff4f8" metalness={0.05} roughness={0.5} /></mesh>
          <mesh position={[0, -H / 2 + 0.05, 0.04]}><boxGeometry args={[R * 2, 0.06, 0.06]} /><meshStandardMaterial color="#fff4f8" metalness={0.05} roughness={0.5} /></mesh>
        </group>
      ))}
      {/* soft pastel exterior uplights around the base */}
      {uplights.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.12, 0.14, 0.1, 10]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.9} /></mesh>
          <pointLight position={[0, 0.4, 0]} intensity={0.4} color="#ffe1ee" distance={6} />
        </group>
      ))}
    </group>
  );
}

function CamRig({ target }: { target: [number, number] | null }) {
  const { camera } = useThree();
  const tmp = useRef(new THREE.Vector3());
  useFrame(() => {
    // static overview by default; smooth fly-in only when a room is focused.
    const desired = target
      ? tmp.current.set(target[0] + 7, 8, target[1] + 7)
      : tmp.current.set(22, 24, 22);
    camera.position.lerp(desired, 0.06);
    camera.lookAt(target ? target[0] : 0, target ? 1 : 1.5, target ? target[1] : 0);
  });
  return null;
}

export default function ConnectedWorld({ onAgent }: { onAgent?: (m: TeamMember) => void }) {
  const pick = onAgent ?? (() => {});
  const [focus, setFocus] = useState<[number, number] | null>(null);
  return (
    <Canvas dpr={[1, 1.25]} camera={{ position: [22, 24, 22], fov: 34, near: 0.1, far: 260 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }} onPointerMissed={() => setFocus(null)}>
      {/* Arturitu pastel theme — bright teal backdrop, soft cheerful lighting */}
      <color attach="background" args={['#1fb8d8']} />
      <fog attach="fog" args={['#1fb8d8', 70, 150]} />
      <ambientLight intensity={1.15} color="#ffffff" />
      <directionalLight position={[18, 30, 14]} intensity={1.05} color="#fff4ea" />
      <hemisphereLight args={['#ffe0ec', '#1fb8d8', 0.7]} />
      {/* soft pastel ambient fills — static (no per-frame animation) */}
      <pointLight position={[0, 10, 0]} color="#fff4f8" intensity={0.7} distance={55} />
      <pointLight position={[14, 6, 14]} color="#ffe1ee" intensity={0.45} distance={30} />
      <pointLight position={[-14, 6, -14]} color="#bfeaf0" intensity={0.45} distance={30} />

      <Suspense fallback={null}>
        {/* === UNIFIED BUILDING SHELL (reference: glass-perimeter floor with warm base uplights) === */}
        <BuildingShell />
        {/* flat black ground — no reflection, no animation (faster load) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[70, 70]} />
          <meshStandardMaterial color="#2aa39a" roughness={0.92} metalness={0} />
        </mesh>
        <Corridors />
        {ROOMS.map((r) => <RoomCell key={r.id} slot={r} onAgent={pick} onRoom={(s) => setFocus(s.pos)} focused={focus?.[0] === r.pos[0] && focus?.[1] === r.pos[1]} />)}
        {/* central emblem */}
        <Text position={[0, 5.5, 0]} fontSize={0.7} color="#3a2440" anchorX="center" letterSpacing={0.3}>6 EMPIRES</Text>
      </Suspense>
      <CamRig target={focus} />
    </Canvas>
  );
}
